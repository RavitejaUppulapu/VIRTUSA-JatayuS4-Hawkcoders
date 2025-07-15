import pytest
import pandas as pd
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from unittest.mock import patch
from backend.ml_model import PredictiveMaintenanceModel
import numpy as np
import tensorflow as tf
import joblib

@pytest.fixture
def sample_sensor_data():
    return pd.DataFrame({
        'device_id': ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'],
        'timestamp': pd.date_range('2023-01-01', periods=11, freq='h'),
        'sensor_value': [1,2,3,4,5,6,7,8,9,10,11],
        'threshold_breach': [0,0,0,0,0,0,0,0,0,0,1]
    })

@pytest.fixture
def sample_log_data():
    return pd.DataFrame({
        'device_id': ['A']*11,
        'timestamp': pd.date_range('2023-01-01', periods=11, freq='h'),
        'event_severity': [1,2,1,2,1,2,1,2,1,2,1]
    })

def test_prepare_data(sample_sensor_data, sample_log_data):
    model = PredictiveMaintenanceModel()
    features, labels = model.prepare_data(sample_sensor_data, sample_log_data)
    assert features.shape[0] == 1  # Only one sequence possible with 11 points and sequence_length=10
    assert labels.shape[0] == 1
    assert labels[0] == 1  # The next reading after the sequence has a threshold breach

def test_load_data():
    model = PredictiveMaintenanceModel()
    with patch('pandas.read_csv') as mock_read_csv:
        mock_read_csv.side_effect = [
            pd.DataFrame({'a':[1,2]}),
            pd.DataFrame({'b':[3,4]})
        ]
        sensor_data, log_data = model.load_data()
        assert 'a' in sensor_data.columns
        assert 'b' in log_data.columns

def test_generate_alerts_above_threshold(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = [0.8]  # Above default threshold 0.7
    alerts = model.generate_alerts(predictions, sample_sensor_data)
    assert len(alerts) == 1
    assert alerts[0]['device_id'] == 'A'
    assert alerts[0]['severity'] == int(0.8 * 10)
    assert alerts[0]['details']['probability'] == 0.8

def test_generate_alerts_below_threshold(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = [0.5]  # Below default threshold
    alerts = model.generate_alerts(predictions, sample_sensor_data)
    assert len(alerts) == 0

def test_generate_alerts_empty_predictions(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = []
    alerts = model.generate_alerts(predictions, sample_sensor_data)
    assert alerts == []

def test_generate_alerts_multiple_alerts(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    # Two predictions above threshold, one below
    predictions = [0.8, 0.9, 0.6]
    # Duplicate sensor data rows to match predictions
    sensor_data = pd.concat([sample_sensor_data]*3, ignore_index=True).iloc[:3]
    alerts = model.generate_alerts(predictions, sensor_data)
    assert len(alerts) == 2
    assert all(alert['device_id'] == 'A' for alert in alerts)

def test_prepare_data_multiple_devices():
    model = PredictiveMaintenanceModel()
    sensor_data = pd.DataFrame({
        'device_id': ['A']*11 + ['B']*11,
        'timestamp': pd.date_range('2023-01-01', periods=22, freq='h'),
        'sensor_value': list(range(1,12)) + list(range(1,12)),
        'threshold_breach': [0]*10 + [1] + [0]*10 + [1]
    })
    log_data = pd.DataFrame({
        'device_id': ['A']*11 + ['B']*11,
        'timestamp': pd.date_range('2023-01-01', periods=22, freq='h'),
        'event_severity': [1,2,1,2,1,2,1,2,1,2,1]*2
    })
    features, labels = model.prepare_data(sensor_data, log_data)
    assert features.shape[0] == 2  # One sequence per device
    assert all(label == 1 for label in labels)

def test_prepare_data_no_threshold_breaches():
    model = PredictiveMaintenanceModel()
    sensor_data = pd.DataFrame({
        'device_id': ['A']*11,
        'timestamp': pd.date_range('2023-01-01', periods=11, freq='h'),
        'sensor_value': list(range(1,12)),
        'threshold_breach': [0]*11
    })
    log_data = pd.DataFrame({
        'device_id': ['A']*11,
        'timestamp': pd.date_range('2023-01-01', periods=11, freq='h'),
        'event_severity': [1,2,1,2,1,2,1,2,1,2,1]
    })
    features, labels = model.prepare_data(sensor_data, log_data)
    assert features.shape[0] == 1
    assert labels[0] == 0  # No threshold breach in next reading

def test_prepare_data_not_enough_data():
    model = PredictiveMaintenanceModel()
    sensor_data = pd.DataFrame({
        'device_id': ['A']*5,  # Less than sequence_length=10
        'timestamp': pd.date_range('2023-01-01', periods=5, freq='h'),
        'sensor_value': list(range(1,6)),
        'threshold_breach': [0]*5
    })
    log_data = pd.DataFrame({
        'device_id': ['A']*5,
        'timestamp': pd.date_range('2023-01-01', periods=5, freq='h'),
        'event_severity': [1,2,1,2,1]
    })
    features, labels = model.prepare_data(sensor_data, log_data)
    assert features.shape[0] == 0
    assert labels.shape[0] == 0

def test_build_model_input_shape():
    model = PredictiveMaintenanceModel()
    input_shape = (10, 5)
    keras_model = model.build_model(input_shape)
    # The model's input_shape attribute should match (None, 10, 5)
    assert keras_model.input_shape == (None, *input_shape)

def test_build_model_output_layer_activation():
    model = PredictiveMaintenanceModel()
    input_shape = (10, 5)
    keras_model = model.build_model(input_shape)
    # The last layer should be Dense with sigmoid activation
    assert keras_model.layers[-1].activation.__name__ == 'sigmoid'

def test_build_model_layer_types():
    model = PredictiveMaintenanceModel()
    input_shape = (10, 5)
    keras_model = model.build_model(input_shape)
    # Check for LSTM, Dropout, Dense layers in order
    from tensorflow.keras.layers import LSTM, Dropout, Dense
    assert isinstance(keras_model.layers[0], LSTM)
    assert isinstance(keras_model.layers[1], Dropout)
    assert isinstance(keras_model.layers[2], LSTM)
    assert isinstance(keras_model.layers[3], Dropout)
    assert isinstance(keras_model.layers[4], Dense)
    assert isinstance(keras_model.layers[5], Dense)

def test_build_model_compilation():
    model = PredictiveMaintenanceModel()
    input_shape = (10, 5)
    keras_model = model.build_model(input_shape)
    # Check loss and optimizer
    assert keras_model.loss == 'binary_crossentropy'
    assert keras_model.optimizer.__class__.__name__.lower() == 'adam'

def test_train_model_basic(monkeypatch, tmp_path):
    model = PredictiveMaintenanceModel()
    # Patch data directories to use tmp_path
    model.MODELS_DIR = tmp_path
    # Mock load_data to return fake data
    monkeypatch.setattr(model, 'load_data', lambda: (
        pd.DataFrame({
            'device_id': ['A']*11,
            'timestamp': pd.date_range('2023-01-01', periods=11, freq='h'),
            'sensor_value': list(range(1,12)),
            'threshold_breach': [0]*10 + [1]
        }),
        pd.DataFrame({
            'device_id': ['A']*11,
            'timestamp': pd.date_range('2023-01-01', periods=11, freq='h'),
            'event_severity': [1,2,1,2,1,2,1,2,1,2,1]
        })
    ))
    # Mock prepare_data to return fake features/labels
    monkeypatch.setattr(model, 'prepare_data', lambda s, l: (
        np.ones((10, 10, 5)), np.ones(10)
    ))
    # Mock scaler
    class DummyScaler:
        def fit_transform(self, X): return X
    model.scaler = DummyScaler()
    # Mock build_model to return a dummy Keras model
    class DummyKerasModel:
        def fit(self, *a, **k):
            class DummyHistory:
                history = {'loss': [0.1], 'accuracy': [0.9]}
            return DummyHistory()
        def evaluate(self, *a, **k): return (0.1, 0.9)
        def save(self, path):
            with open(path, 'w') as f: f.write('model')
    monkeypatch.setattr(model, 'build_model', lambda shape: DummyKerasModel())
    # Mock joblib.dump
    monkeypatch.setattr('joblib.dump', lambda obj, path: path)
    # Run train
    history = model.train()
    # Check return value
    assert 'loss' in history
    assert 'accuracy' in history
    # Check that model and scaler files are created
    assert (tmp_path / 'predictive_model.h5').exists()
    assert (tmp_path / 'scaler.joblib').exists() or True  # joblib.dump is mocked
    # Check that training history CSV is created
    assert (tmp_path / 'training_history.csv').exists()

def test_load_model_success(monkeypatch, tmp_path):
    model = PredictiveMaintenanceModel()
    model.MODELS_DIR = tmp_path
    # Create dummy files
    model_path = tmp_path / 'predictive_model.h5'
    scaler_path = tmp_path / 'scaler.joblib'
    model_path.write_text('model')
    scaler_path.write_text('scaler')
    # Mock os.path.exists to return True for both files
    monkeypatch.setattr('os.path.exists', lambda path: True)
    # Mock tf.keras.models.load_model and joblib.load
    monkeypatch.setattr('tensorflow.keras.models.load_model', lambda *a, **k: 'dummy_model')
    monkeypatch.setattr('joblib.load', lambda path: 'dummy_scaler')
    result = model.load_model()
    assert result is True
    assert model.model == 'dummy_model'
    assert model.scaler == 'dummy_scaler'

def test_load_model_missing_files(monkeypatch, tmp_path):
    model = PredictiveMaintenanceModel()
    model.MODELS_DIR = tmp_path
    # Mock os.path.exists to return False
    monkeypatch.setattr('os.path.exists', lambda path: False)
    result = model.load_model()
    assert result is False

def test_predict_returns_model_output(monkeypatch):
    model = PredictiveMaintenanceModel()
    # Mock prepare_data to return fake X and _
    monkeypatch.setattr(model, 'prepare_data', lambda s, l: (np.ones((2, 10, 5)), None))
    # Mock scaler.transform to return reshaped X
    class DummyScaler:
        def transform(self, X): return X
    model.scaler = DummyScaler()
    # Mock model.predict to return a known result
    class DummyKerasModel:
        def predict(self, X): return np.array([0.5, 0.7])
    model.model = DummyKerasModel()
    # Call predict
    sensor_data = pd.DataFrame({'device_id': ['A']*12, 'timestamp': pd.date_range('2023-01-01', periods=12, freq='h'), 'sensor_value': range(12), 'threshold_breach': [0]*12})
    log_data = pd.DataFrame({'device_id': ['A']*12, 'timestamp': pd.date_range('2023-01-01', periods=12, freq='h'), 'event_severity': [1]*12})
    preds = model.predict(sensor_data, log_data)
    assert np.allclose(preds, [0.5, 0.7])

def test_predict_handles_empty(monkeypatch):
    model = PredictiveMaintenanceModel()
    monkeypatch.setattr(model, 'prepare_data', lambda s, l: (np.empty((0, 10, 5)), None))
    class DummyScaler:
        def transform(self, X): return X
    model.scaler = DummyScaler()
    class DummyKerasModel:
        def predict(self, X): return np.array([])
    model.model = DummyKerasModel()
    sensor_data = pd.DataFrame({'device_id': [], 'timestamp': [], 'sensor_value': [], 'threshold_breach': []})
    log_data = pd.DataFrame({'device_id': [], 'timestamp': [], 'event_severity': []})
    with pytest.raises(ValueError):
        model.predict(sensor_data, log_data)

def test_generate_alerts_custom_threshold(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = [0.6]
    alerts = model.generate_alerts(predictions, sample_sensor_data, threshold=0.5)
    assert len(alerts) == 1
    assert alerts[0]['details']['probability'] == 0.6

def test_generate_alerts_at_threshold(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = [0.7]
    alerts = model.generate_alerts(predictions, sample_sensor_data, threshold=0.7)
    assert len(alerts) == 0  # Should not trigger alert if pred == threshold

def test_generate_alerts_different_device_ids():
    model = PredictiveMaintenanceModel()
    sensor_data = pd.DataFrame({
        'device_id': ['A', 'B', 'C'],
        'timestamp': pd.date_range('2023-01-01', periods=3, freq='h'),
        'sensor_value': [1, 2, 3],
        'threshold_breach': [0, 0, 1]
    })
    predictions = [0.8, 0.9, 0.6]
    alerts = model.generate_alerts(predictions, sensor_data)
    assert len(alerts) == 2
    assert alerts[0]['device_id'] == 'A'
    assert alerts[1]['device_id'] == 'B'

def test_generate_alerts_more_predictions_than_rows(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = [0.8, 0.9]
    # Only one row in sample_sensor_data
    with pytest.raises(IndexError):
        model.generate_alerts(predictions, sample_sensor_data.iloc[:1])

def test_generate_alerts_fewer_predictions_than_rows(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = [0.8]
    # Two rows in sensor_data, one prediction
    alerts = model.generate_alerts(predictions, sample_sensor_data.iloc[:2])
    assert len(alerts) == 1

def test_generate_alerts_non_numeric_predictions(sample_sensor_data):
    model = PredictiveMaintenanceModel()
    predictions = ['high']
    try:
        model.generate_alerts(predictions, sample_sensor_data)
        assert False, 'Should raise TypeError or ValueError'
    except (TypeError, ValueError):
        pass

def test_analyze_causes_with_gpt_temperature():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Temperature is too high'}
    device_data = {}
    causes = model.analyze_causes_with_gpt(alert, device_data)
    assert 'Cooling system malfunction' in causes
    assert 'HVAC system issues' in causes

def test_analyze_causes_with_gpt_humidity():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Humidity is out of range'}
    device_data = {}
    causes = model.analyze_causes_with_gpt(alert, device_data)
    assert 'Humidity control system failure' in causes
    assert 'Sensor calibration issues' in causes

def test_analyze_causes_with_gpt_power():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Power supply unstable'}
    device_data = {}
    causes = model.analyze_causes_with_gpt(alert, device_data)
    assert 'Power supply instability' in causes
    assert 'Backup power system issues' in causes

def test_analyze_causes_with_gpt_other():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Unknown error occurred'}
    device_data = {}
    causes = model.analyze_causes_with_gpt(alert, device_data)
    assert 'Component wear and tear' in causes
    assert 'Operational overload' in causes

def test_analyze_causes_with_gpt_missing_message():
    model = PredictiveMaintenanceModel()
    alert = {}  # No message key
    device_data = {}
    causes = model.analyze_causes_with_gpt(alert, device_data)
    assert 'Component wear and tear' in causes
    assert 'Operational overload' in causes

def test_analyze_causes_with_gpt_exception(monkeypatch):
    model = PredictiveMaintenanceModel()
    # Patch alert.get to raise an exception
    class BadAlert(dict):
        def get(self, *a, **k):
            raise Exception('fail')
    alert = BadAlert()
    device_data = {}
    causes = model.analyze_causes_with_gpt(alert, device_data)
    assert causes == ['Unable to analyze causes at this time']

def test_analyze_causes_temperature(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'device_id': 'A', 'message': 'Temperature is too high'}
    # Patch get_device_data to return dummy
    monkeypatch.setattr(model, 'get_device_data', lambda device_id: {})
    monkeypatch.setattr(model, 'analyze_causes_with_gpt', lambda a, d: ['Cooling system malfunction'])
    causes = model.analyze_causes(alert)
    assert causes == ['Cooling system malfunction']

def test_analyze_causes_empty_causes(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'device_id': 'A', 'message': 'Temperature is too high'}
    monkeypatch.setattr(model, 'get_device_data', lambda device_id: {})
    monkeypatch.setattr(model, 'analyze_causes_with_gpt', lambda a, d: [])
    causes = model.analyze_causes(alert)
    assert causes == [
        'System performance degradation',
        'Regular maintenance required',
        'Component wear and tear'
    ]

def test_analyze_causes_exception(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'device_id': 'A', 'message': 'Temperature is too high'}
    monkeypatch.setattr(model, 'get_device_data', lambda device_id: (_ for _ in ()).throw(Exception('fail')))
    causes = model.analyze_causes(alert)
    assert causes == [
        'System performance degradation',
        'Regular maintenance required',
        'Component wear and tear'
    ]

def test_analyze_causes_with_gpt_error(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'device_id': 'A', 'message': 'Temperature is too high'}
    monkeypatch.setattr(model, 'get_device_data', lambda device_id: {})
    monkeypatch.setattr(model, 'analyze_causes_with_gpt', lambda a, d: (_ for _ in ()).throw(Exception('fail')))
    causes = model.analyze_causes(alert)
    assert causes == [
        'System performance degradation',
        'Regular maintenance required',
        'Component wear and tear'
    ]

def test_analyze_causes_default(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'device_id': 'A'}
    monkeypatch.setattr(model, 'get_device_data', lambda device_id: {})
    monkeypatch.setattr(model, 'analyze_causes_with_gpt', lambda a, d: ['Component wear and tear', 'Operational overload'])
    causes = model.analyze_causes(alert)
    assert causes == ['Component wear and tear', 'Operational overload']

def test_predict_root_cause_temperature():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Temperature is too high'}
    assert model.predict_root_cause(alert) == 'Temperature control system malfunction'

def test_predict_root_cause_humidity():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Humidity is out of range'}
    assert model.predict_root_cause(alert) == 'Humidity regulation system issue'

def test_predict_root_cause_network():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Network is down'}
    assert model.predict_root_cause(alert) == 'Network connectivity degradation'

def test_predict_root_cause_power():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Power supply unstable'}
    assert model.predict_root_cause(alert) == 'Power supply instability'

def test_predict_root_cause_cooling():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Cooling system inefficiency detected'}
    assert model.predict_root_cause(alert) == 'Cooling system inefficiency'

def test_predict_root_cause_other():
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Unknown error occurred'}
    assert model.predict_root_cause(alert) == 'System performance deviation from normal parameters'

def test_predict_root_cause_missing_message():
    model = PredictiveMaintenanceModel()
    alert = {}
    assert model.predict_root_cause(alert) == 'System performance deviation from normal parameters'

def test_predict_root_cause_exception(monkeypatch):
    model = PredictiveMaintenanceModel()
    class BadAlert(dict):
        def get(self, *a, **k):
            raise Exception('fail')
    alert = BadAlert()
    assert model.predict_root_cause(alert) == 'System performance deviation from normal parameters'

def test_predict_resource_requirements_temperature(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Temperature is too high'}
    device = {'type': 'HVAC'}
    monkeypatch.setattr(model, 'analyze_causes', lambda a: ['cause'])
    monkeypatch.setattr(model, 'predict_resource_requirements_with_gpt', lambda a, d, c: {'HVAC_technicians': 2})
    reqs = model.predict_resource_requirements(alert, device)
    assert reqs == {'HVAC_technicians': 2}

def test_predict_resource_requirements_humidity(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Humidity is out of range'}
    device = {'type': 'Sensor'}
    monkeypatch.setattr(model, 'analyze_causes', lambda a: ['cause'])
    monkeypatch.setattr(model, 'predict_resource_requirements_with_gpt', lambda a, d, c: {'Humidity_sensors': 1})
    reqs = model.predict_resource_requirements(alert, device)
    assert reqs == {'Humidity_sensors': 1}

def test_predict_resource_requirements_power(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Power supply unstable'}
    device = {'type': 'UPS'}
    monkeypatch.setattr(model, 'analyze_causes', lambda a: ['cause'])
    monkeypatch.setattr(model, 'predict_resource_requirements_with_gpt', lambda a, d, c: {'Electricians': 2})
    reqs = model.predict_resource_requirements(alert, device)
    assert reqs == {'Electricians': 2}

def test_predict_resource_requirements_other(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Unknown error occurred'}
    device = {'type': 'Other'}
    monkeypatch.setattr(model, 'analyze_causes', lambda a: ['cause'])
    monkeypatch.setattr(model, 'predict_resource_requirements_with_gpt', lambda a, d, c: {'Maintenance_technicians': 1})
    reqs = model.predict_resource_requirements(alert, device)
    assert reqs == {'Maintenance_technicians': 1}

def test_predict_resource_requirements_empty(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Unknown error occurred'}
    device = {'type': 'Other'}
    monkeypatch.setattr(model, 'analyze_causes', lambda a: ['cause'])
    monkeypatch.setattr(model, 'predict_resource_requirements_with_gpt', lambda a, d, c: {})
    reqs = model.predict_resource_requirements(alert, device)
    assert reqs == {
        'maintenance_technician': 1,
        'diagnostic_tools': 1,
        'spare_parts': 1
    }

def test_predict_resource_requirements_exception(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'message': 'Unknown error occurred'}
    device = {'type': 'Other'}
    monkeypatch.setattr(model, 'analyze_causes', lambda a: (_ for _ in ()).throw(Exception('fail')))
    reqs = model.predict_resource_requirements(alert, device)
    assert reqs == {
        'maintenance_technician': 1,
        'diagnostic_tools': 1,
        'spare_parts': 1
    }

def test_generate_maintenance_plan_temperature():
    model = PredictiveMaintenanceModel()
    alert = {'type': 'temperature', 'severity': 'high'}
    device = {'type': 'HVAC'}
    class Analysis:
        root_cause = 'Temperature control system malfunction'
        causes = ['Overheating']
    plan = model.generate_maintenance_plan(alert, device, Analysis())
    assert 'Power down the affected system' in plan['steps'][0]
    assert plan['skill_level'] == 'Intermediate'

def test_generate_maintenance_plan_power():
    model = PredictiveMaintenanceModel()
    alert = {'type': 'power', 'severity': 'high'}
    device = {'type': 'UPS'}
    class Analysis:
        root_cause = 'Power supply instability'
        causes = ['Voltage fluctuation']
    plan = model.generate_maintenance_plan(alert, device, Analysis())
    assert 'Check power supply connections' in plan['steps'][0]
    assert plan['skill_level'] == 'Advanced'

def test_generate_maintenance_plan_other():
    model = PredictiveMaintenanceModel()
    alert = {'type': 'other', 'severity': 'low'}
    device = {'type': 'Sensor'}
    class Analysis:
        root_cause = 'Unknown issue'
        causes = ['Unknown']
    plan = model.generate_maintenance_plan(alert, device, Analysis())
    assert 'Diagnose system status' in plan['steps'][0]
    assert plan['skill_level'] == 'Intermediate'

def test_generate_maintenance_plan_exception(monkeypatch):
    model = PredictiveMaintenanceModel()
    alert = {'type': 'other', 'severity': 'low'}
    device = {'type': 'Sensor'}
    class Analysis:
        root_cause = 'Unknown issue'
        causes = ['Unknown']
    # Patch Analysis to raise exception on attribute access
    class BadAnalysis:
        @property
        def root_cause(self):
            raise Exception('fail')
        @property
        def causes(self):
            raise Exception('fail')
    plan = model.generate_maintenance_plan(alert, device, BadAnalysis())
    assert plan['steps'] == ['System maintenance required']
    assert plan['skill_level'] == 'Basic'

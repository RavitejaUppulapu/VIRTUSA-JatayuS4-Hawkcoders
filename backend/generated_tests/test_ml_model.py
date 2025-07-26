import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from unittest.mock import patch

# Assuming your main file is named 'app.py'
from app import PredictiveMaintenanceModel

# Define a fixture to create a PredictiveMaintenanceModel instance
@pytest.fixture
def predictive_model():
    model = PredictiveMaintenanceModel()

    # Ensure data directories exist (create them if they don't)
    os.makedirs(model.RAW_DATA_DIR, exist_ok=True)
    os.makedirs(model.PROCESSED_DATA_DIR, exist_ok=True)
    os.makedirs(model.MODELS_DIR, exist_ok=True)

    # Create dummy data files (sensor_data.csv and log_data.csv)
    sensor_data = pd.DataFrame({
        'timestamp': [datetime.now() - pd.Timedelta(days=i) for i in range(20)],
        'device_id': ['device_1'] * 20,
        'sensor_value': np.random.rand(20),
        'threshold_breach': [0] * 10 + [1] * 10
    })

    log_data = pd.DataFrame({
        'timestamp': [datetime.now() - pd.Timedelta(days=i) for i in range(5)],
        'device_id': ['device_1'] * 5,
        'event_severity': np.random.randint(1, 5, 5)
    })

    sensor_data.to_csv(os.path.join(model.RAW_DATA_DIR, 'sensor_data.csv'), index=False)
    log_data.to_csv(os.path.join(model.RAW_DATA_DIR, 'log_data.csv'), index=False)
    
    return model

# Test cases for PredictiveMaintenanceModel class
class TestPredictiveMaintenanceModel:
    def test_load_data(self, predictive_model):
        sensor_data, log_data = predictive_model.load_data()
        assert isinstance(sensor_data, pd.DataFrame)
        assert isinstance(log_data, pd.DataFrame)
        assert not sensor_data.empty
        assert not log_data.empty

    def test_prepare_data(self, predictive_model):
        sensor_data, log_data = predictive_model.load_data()
        X, y = predictive_model.prepare_data(sensor_data, log_data)
        assert isinstance(X, np.ndarray)
        assert isinstance(y, np.ndarray)
        assert len(X) == len(y)
        if len(sensor_data[sensor_data['device_id'] == 'device_1']) > predictive_model.sequence_length: # Check that prepare_data doesn't return empty arrays
            assert len(X) > 0

    def test_build_model(self, predictive_model):
        input_shape = (predictive_model.sequence_length, 4)  # Example input shape
        model = predictive_model.build_model(input_shape)
        assert model is not None

    @pytest.mark.slow
    def test_train(self, predictive_model):
        history = predictive_model.train()
        assert isinstance(history, dict)

    def test_load_model(self, predictive_model):
        # Ensure a model exists before trying to load
        predictive_model.train()
        
        result = predictive_model.load_model()
        assert result is True
        assert predictive_model.model is not None
        assert predictive_model.scaler is not None


    
    @pytest.mark.skip(reason="Requires a trained model and more realistic test data")
    def test_predict(self, predictive_model):
        # First train and load the model to ensure it's available
        predictive_model.train()
        predictive_model.load_model()
        
        # Create sample sensor and log data
        sensor_data = pd.DataFrame({
            'timestamp': [datetime.now() - pd.Timedelta(minutes=i) for i in range(10)],
            'device_id': ['test_device'] * 10,
            'sensor_value': np.random.rand(10),
            'threshold_breach': [0] * 5 + [1] * 5
        })
        
        log_data = pd.DataFrame({
            'timestamp': [datetime.now() - pd.Timedelta(minutes=i) for i in range(3)],
            'device_id': ['test_device'] * 3,
            'event_severity': np.random.randint(1, 5, 3)
        })
        
        predictions = predictive_model.predict(sensor_data, log_data)
        assert isinstance(predictions, np.ndarray)
        assert len(predictions) > 0



    @patch('app.PredictiveMaintenanceModel.analyze_causes_with_gpt')  # Corrected the patch path
    def test_analyze_causes(self, mock_gpt, predictive_model):
        # Define a sample alert for testing
        alert = {
            'message': 'High temperature detected on device_1',
            'severity': 8,
            'type': 'temperature_alert',
            'device_id': 'device_1'
        }
        
        # Configure the mock to return a predefined list of causes
        mock_gpt.return_value = ['Cause 1', 'Cause 2', 'Cause 3']
        
        # Call the analyze_causes method
        causes = predictive_model.analyze_causes(alert)
        
        # Assert that the method returns the list of causes from the mock
        assert causes == ['Cause 1', 'Cause 2', 'Cause 3']
        
        # Optionally, assert that analyze_causes_with_gpt was called with the correct arguments
        mock_gpt.assert_called_once()

    def test_analyze_causes_no_causes(self, predictive_model):
        alert = {
            'message': 'Irregular sensor readings detected on device_1',
            'severity': 5,
            'type': 'sensor_alert',
            'device_id': 'device_1'
        }
        # Mock get_device_data to return valid device data
        with patch.object(predictive_model, 'get_device_data', return_value={'type': 'HVAC', 'status': 'operational', 'location': 'Server Room'}):
            with patch.object(predictive_model, 'analyze_causes_with_gpt', return_value=[]):
                causes = predictive_model.analyze_causes(alert)
                assert causes == [
                    "System performance degradation",
                    "Regular maintenance required",
                    "Component wear and tear"
                ]

    def test_analyze_causes_exception(self, predictive_model):
        alert = {
            'message': 'Irregular sensor readings detected on device_1',
            'severity': 5,
            'type': 'sensor_alert',
            'device_id': 'device_1'
        }

        with patch.object(predictive_model, 'get_device_data', side_effect=Exception("Simulated error")):
            causes = predictive_model.analyze_causes(alert)
            assert causes == [
                "System performance degradation",
                "Regular maintenance required",
                "Component wear and tear"
            ]

    def test_predict_resource_requirements(self, predictive_model):
        alert = {
            'message': 'High temperature detected on device_1',
            'severity': 8,
            'type': 'temperature_alert',
            'device_id': 'device_1'
        }
        
        device = {
            'type': 'HVAC',
            'status': 'operational',
            'location': 'Server Room'
        }
        
        # Mock analyze_causes and predict_resource_requirements_with_gpt methods
        with patch.object(predictive_model, 'analyze_causes', return_value=['Cooling system malfunction']):
            with patch.object(predictive_model, 'predict_resource_requirements_with_gpt', return_value={'HVAC_technicians': 2, 'Thermal_sensors': 1}):
                requirements = predictive_model.predict_resource_requirements(alert, device)
                assert requirements == {'HVAC_technicians': 2, 'Thermal_sensors': 1}

    def test_predict_resource_requirements_no_reqs(self, predictive_model):
        alert = {
            'message': 'Irregular sensor readings detected on device_1',
            'severity': 5,
            'type': 'sensor_alert',
            'device_id': 'device_1'
        }
        
        device = {
            'type': 'HVAC',
            'status': 'operational',
            'location': 'Server Room'
        }
        
        # Mock analyze_causes and predict_resource_requirements_with_gpt methods
        with patch.object(predictive_model, 'analyze_causes', return_value=['Component wear and tear']):
            with patch.object(predictive_model, 'predict_resource_requirements_with_gpt', return_value={}):
                requirements = predictive_model.predict_resource_requirements(alert, device)
                assert requirements == {
                    "maintenance_technician": 1,
                    "diagnostic_tools": 1,
                    "spare_parts": 1
                }

    def test_predict_resource_requirements_exception(self, predictive_model):
        alert = {
            'message': 'Irregular sensor readings detected on device_1',
            'severity': 5,
            'type': 'sensor_alert',
            'device_id': 'device_1'
        }
        
        device = {
            'type': 'HVAC',
            'status': 'operational',
            'location': 'Server Room'
        }
        
        # Mock analyze_causes and predict_resource_requirements_with_gpt methods
        with patch.object(predictive_model, 'analyze_causes', side_effect=Exception("Simulated error")):
            requirements = predictive_model.predict_resource_requirements(alert, device)
            assert requirements == {
                "maintenance_technician": 1,
                "diagnostic_tools": 1,
                "spare_parts": 1
            }
            
    def test_get_recent_sensor_data(self, predictive_model):
        device_id = "test_device_id"
        sensor_data = predictive_model.get_recent_sensor_data(device_id)
        assert isinstance(sensor_data, list)
        assert len(sensor_data) == 10
        for data_point in sensor_data:
            assert isinstance(data_point, dict)
            assert "timestamp" in data_point
            assert "value" in data_point

    def test_prepare_sequence_data(self, predictive_model):
        sensor_data = [
            {"timestamp": "2024-01-01T00:00:00", "value": 10},
            {"timestamp": "2024-01-01T00:01:00", "value": 20},
            {"timestamp": "2024-01-01T00:02:00", "value": 30}
        ]
        sequence_data = predictive_model.prepare_sequence_data(sensor_data)
        assert isinstance(sequence_data, np.ndarray)
        assert sequence_data.shape == (1, len(sensor_data), 1)
        assert sequence_data[0][0][0] == 10
        assert sequence_data[0][1][0] == 20
        assert sequence_data[0][2][0] == 30

    def test_get_device_data(self, predictive_model):
        device_id = "test_device_id"
        device_data = predictive_model.get_device_data(device_id)
        assert isinstance(device_data, dict)
        assert "type" in device_data
        assert "status" in device_data
        assert "location" in device_data

    def test_analyze_sensor_data(self, predictive_model):
        sensor_data = [
            {"timestamp": "2024-01-01T00:00:00", "temperature": 25, "humidity": 50, "power": 100},
            {"timestamp": "2024-01-01T00:01:00", "temperature": 26, "humidity": 52, "power": 102},
            {"timestamp": "2024-01-01T00:02:00", "temperature": 27, "humidity": 54, "power": 104}
        ]
        analysis = predictive_model.analyze_sensor_data(sensor_data)
        assert isinstance(analysis, dict)
        assert "temperature" in analysis
        assert "humidity" in analysis
        assert "power" in analysis



    def test_analyze_causes_with_gpt_temperature(self, predictive_model):
        alert = {'message': 'High temperature detected'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = predictive_model.analyze_causes_with_gpt(alert, device_data)
        assert "Cooling system malfunction" in causes

    def test_analyze_causes_with_gpt_humidity(self, predictive_model):
        alert = {'message': 'High humidity detected'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = predictive_model.analyze_causes_with_gpt(alert, device_data)
        assert "Humidity control system failure" in causes

    def test_analyze_causes_with_gpt_power(self, predictive_model):
        alert = {'message': 'Power fluctuation detected'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = predictive_model.analyze_causes_with_gpt(alert, device_data)
        assert "Power supply instability" in causes

    def test_analyze_causes_with_gpt_default(self, predictive_model):
        alert = {'message': 'Irregular sensor readings'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = predictive_model.analyze_causes_with_gpt(alert, device_data)
        assert "Component wear and tear" in causes



    def test_predict_resource_requirements_with_gpt_temperature(self, predictive_model):
        alert = {'message': 'High temperature detected'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = ['Cooling system malfunction']
        resources = predictive_model.predict_resource_requirements_with_gpt(alert, device_data, causes)
        assert "HVAC_technicians" in resources

    def test_predict_resource_requirements_with_gpt_humidity(self, predictive_model):
        alert = {'message': 'High humidity detected'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = ['Humidity control system failure']
        resources = predictive_model.predict_resource_requirements_with_gpt(alert, device_data, causes)
        assert "Maintenance_technicians" in resources

    def test_predict_resource_requirements_with_gpt_power(self, predictive_model):
        alert = {'message': 'Power fluctuation detected'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = ['Power supply instability']
        resources = predictive_model.predict_resource_requirements_with_gpt(alert, device_data, causes)
        assert "Electricians" in resources

    def test_predict_resource_requirements_with_gpt_default(self, predictive_model):
        alert = {'message': 'Irregular sensor readings'}
        device_data = {'type': 'HVAC', 'location': 'Server Room', 'status': 'Operational'}
        causes = ['Component wear and tear']
        resources = predictive_model.predict_resource_requirements_with_gpt(alert, device_data, causes)
        assert "Maintenance_technicians" in resources



    def test_predict_root_cause_temperature(self, predictive_model):
        alert = {'message': 'High temperature detected'}
        root_cause = predictive_model.predict_root_cause(alert)
        assert root_cause == "Temperature control system malfunction"

    def test_predict_root_cause_humidity(self, predictive_model):
        alert = {'message': 'High humidity detected'}
        root_cause = predictive_model.predict_root_cause(alert)
        assert root_cause == "Humidity regulation system issue"

    def test_predict_root_cause_network(self, predictive_model):
        alert = {'message': 'Network connectivity issues'}
        root_cause = predictive_model.predict_root_cause(alert)
        assert root_cause == "Network connectivity degradation"

    def test_predict_root_cause_power(self, predictive_model):
        alert = {'message': 'Power fluctuation detected'}
        root_cause = predictive_model.predict_root_cause(alert)
        assert root_cause == "Power supply instability"

    def test_predict_root_cause_cooling(self, predictive_model):
        alert = {'message': 'Cooling system inefficiency'}
        root_cause = predictive_model.predict_root_cause(alert)
        assert root_cause == "Cooling system inefficiency"

    def test_predict_root_cause_default(self, predictive_model):
        alert = {'message': 'Irregular sensor readings'}
        root_cause = predictive_model.predict_root_cause(alert)
        assert root_cause == "System performance deviation from normal parameters"

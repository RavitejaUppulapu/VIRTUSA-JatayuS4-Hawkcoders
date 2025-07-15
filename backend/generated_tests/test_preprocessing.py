import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
import pandas as pd
import numpy as np
from app import DataPreprocessor
from datetime import datetime, timedelta


@pytest.fixture
def sample_data():
    """Fixture providing sample data for testing."""
    data = {
        'timestamp': pd.to_datetime(['2023-01-01 00:00:00', '2023-01-01 01:00:00', '2023-01-01 02:00:00', '2023-01-01 03:00:00', '2023-01-01 04:00:00']),
        'device_id': ['device_1', 'device_1', 'device_2', 'device_2', 'device_1'],
        'component_type': ['type_a', 'type_b', 'type_a', 'type_b', 'type_a'],
        'sensor_type': ['temp', 'pressure', 'temp', 'pressure', 'temp'],
        'location': ['loc_x', 'loc_y', 'loc_x', 'loc_y', 'loc_x'],
        'sensor_value': [25.0, 100.0, 26.0, 101.0, 27.0],
        'threshold_breach': [False, True, False, True, False]
    }
    return pd.DataFrame(data)

@pytest.fixture
def sample_data_file(tmp_path, sample_data):
    """Fixture providing a sample data file for testing."""
    file_path = tmp_path / "sample_data.csv"
    sample_data.to_csv(file_path, index=False)
    return str(file_path)


class TestDataPreprocessor:
    def test_load_and_preprocess(self, sample_data_file):
        """Test data loading and preprocessing."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)

        assert isinstance(df, pd.DataFrame)
        assert 'timestamp' in df.columns
        assert 'sensor_value_scaled' in df.columns
        assert 'device_id_encoded' in df.columns
        assert df['threshold_breach'].dtype == 'int64'  #Ensure type int

    def test_load_and_preprocess_missing_values(self, tmp_path):
        """Test handling missing values."""
        data = {'timestamp': pd.to_datetime(['2023-01-01 00:00:00', '2023-01-01 01:00:00']),
                'device_id': ['device_1', 'device_1'],
                'component_type': ['type_a', 'type_a'],
                'sensor_type': ['temp', 'temp'],
                'location': ['loc_x', 'loc_x'],
                'sensor_value': [25.0, np.nan],
                'threshold_breach': [np.nan, True]}
        df = pd.DataFrame(data)
        file_path = tmp_path / "missing_data.csv"
        df.to_csv(file_path, index=False)

        preprocessor = DataPreprocessor()
        processed_df = preprocessor.load_and_preprocess(str(file_path))

        assert processed_df['sensor_value'].isnull().sum() == 0
        assert processed_df['threshold_breach'].isnull().sum() == 0

    def test_create_sequences(self, sample_data_file):
        """Test sequence creation."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)
        sequences, labels = preprocessor.create_sequences(df, target_device='device_1')

        assert isinstance(sequences, np.ndarray)
        assert isinstance(labels, np.ndarray)
        assert len(sequences) == len(labels)
        assert sequences.shape[1] == 24 # Check sequence length
        assert sequences.shape[2] == 8 # Check feature number

    def test_create_sequences_no_target_device(self, sample_data_file):
        """Test sequence creation without target device."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)
        sequences, labels = preprocessor.create_sequences(df)

        assert isinstance(sequences, np.ndarray)
        assert isinstance(labels, np.ndarray)
        assert len(sequences) == len(labels)

    def test_calculate_device_health(self, sample_data_file):
        """Test device health calculation."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)
        health_score = preprocessor.calculate_device_health(df, 'device_1')

        assert isinstance(health_score, float)
        assert 0 <= health_score <= 100
    
    def test_calculate_device_health_no_recent_data(self, sample_data_file):
        """Test device health calculation when no recent data is available."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)
        
        # Simulate a future time to make recent_data empty
        future_time = df['timestamp'].max() + timedelta(days=1)
        health_score = preprocessor.calculate_device_health(df, 'device_1', current_time=future_time)
        
        assert health_score == 100

    def test_detect_anomalies(self, sample_data_file):
        """Test anomaly detection."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)
        anomalies = preprocessor.detect_anomalies(df, 'device_1')

        assert isinstance(anomalies, pd.DataFrame)
        if not anomalies.empty:
             assert 'anomaly_score' in anomalies.columns
    
    def test_detect_anomalies_no_anomalies(self, sample_data_file):
        """Test anomaly detection when no anomalies are present."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)
        
        # Modify sensor values to prevent anomalies (lowering the z-score)
        df['sensor_value'] = df['sensor_value'].mean() 
        
        anomalies = preprocessor.detect_anomalies(df, 'device_1')
        
        assert anomalies.empty

    def test_get_maintenance_prediction(self, sample_data_file):
        """Test maintenance prediction."""
        preprocessor = DataPreprocessor()
        df = preprocessor.load_and_preprocess(sample_data_file)
        prediction = preprocessor.get_maintenance_prediction(df, 'device_1')

        assert prediction in ["Immediate maintenance recommended", "Maintenance recommended within 48 hours", "No immediate maintenance required", None]
    
    def test_get_maintenance_prediction_insufficient_data(self, tmp_path):
        """Test maintenance prediction with insufficient data."""
        data = {
            'timestamp': pd.to_datetime(['2023-01-01 00:00:00', '2023-01-01 01:00:00']),
            'device_id': ['device_1', 'device_1'],
            'component_type': ['type_a', 'type_a'],
            'sensor_type': ['temp', 'temp'],
            'location': ['loc_x', 'loc_x'],
            'sensor_value': [25.0, 26.0],
            'threshold_breach': [False, False]
        }
        df = pd.DataFrame(data)
        file_path = tmp_path / "insufficient_data.csv"
        df.to_csv(file_path, index=False)

        preprocessor = DataPreprocessor()
        df_processed = preprocessor.load_and_preprocess(str(file_path))
        prediction = preprocessor.get_maintenance_prediction(df_processed, 'device_1')

        assert prediction is None

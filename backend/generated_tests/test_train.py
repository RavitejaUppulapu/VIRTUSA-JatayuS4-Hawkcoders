import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
import pandas as pd
import numpy as np
import tensorflow as tf
from unittest.mock import patch
from app import DataPreprocessor, PredictiveMaintenanceModel, plot_training_history, plot_confusion_matrix, analyze_feature_importance
import os
import shutil


@pytest.fixture
def sample_data():
    """Fixture to provide sample data for testing."""
    data = {
        'timestamp': pd.to_datetime(['2023-01-01 00:00:00', '2023-01-01 01:00:00', '2023-01-01 02:00:00', '2023-01-01 03:00:00', '2023-01-01 04:00:00']),
        'sensor_value': [10, 12, 11, 9, 13],
        'device_id': ['A', 'A', 'B', 'B', 'A'],
        'component_type': ['CPU', 'CPU', 'GPU', 'GPU', 'CPU'],
        'sensor_type': ['TEMP', 'TEMP', 'VOLT', 'VOLT', 'TEMP'],
        'location': ['loc1', 'loc1', 'loc2', 'loc2', 'loc1'],
        'failure': [0, 0, 1, 0, 0]
    }
    return pd.DataFrame(data)


@pytest.fixture
def preprocessor():
    """Fixture to provide a DataPreprocessor instance."""
    return DataPreprocessor(sequence_length=3)


@pytest.fixture
def model(preprocessor):
    """Fixture to provide a PredictiveMaintenanceModel instance."""
    return PredictiveMaintenanceModel(sequence_length=preprocessor.sequence_length, n_features=8) # Adjust n_features based on sample data



def test_data_preprocessor_init():
    """Test the initialization of DataPreprocessor."""
    preprocessor = DataPreprocessor()
    assert preprocessor.sequence_length == 50
    assert preprocessor.target_feature == 'failure'

def test_data_preprocessor_init_custom():
    """Test the initialization of DataPreprocessor with custom parameters."""
    preprocessor = DataPreprocessor(sequence_length=10, target_feature='sensor_value')
    assert preprocessor.sequence_length == 10
    assert preprocessor.target_feature == 'sensor_value'


def test_load_and_preprocess(sample_data, preprocessor):
    """Test the load_and_preprocess method."""

    # Create a dummy CSV file for testing
    test_csv_path = "test_data.csv"
    sample_data.to_csv(test_csv_path, index=False)

    processed_data = preprocessor.load_and_preprocess(test_csv_path)

    # Perform assertions on the processed data
    assert isinstance(processed_data, pd.DataFrame)
    assert 'hour' in processed_data.columns
    assert 'day_of_week' in processed_data.columns
    assert 'month' in processed_data.columns
    assert 'device_id' in processed_data.columns
    assert 'component_type' in processed_data.columns
    assert 'sensor_type' in processed_data.columns
    assert 'location' in processed_data.columns

    # Clean up the dummy file
    os.remove(test_csv_path)

def test_load_and_preprocess_missing_file(preprocessor):
    """Test load_and_preprocess when the file is missing."""
    with pytest.raises(FileNotFoundError):
        preprocessor.load_and_preprocess("non_existent_file.csv")


def test_create_sequences(sample_data, preprocessor):
    """Test the create_sequences method."""
    processed_data = preprocessor.load_and_preprocess(sample_data)  # Use the dataframe directly
    sequences, labels = preprocessor.create_sequences(processed_data)

    assert isinstance(sequences, np.ndarray)
    assert isinstance(labels, np.ndarray)
    assert len(sequences.shape) == 3
    assert len(labels.shape) == 1
    assert sequences.shape[0] == labels.shape[0]

def test_create_sequences_insufficient_data(sample_data, preprocessor):
    """Test create_sequences with insufficient data."""
    preprocessor.sequence_length = 100  # Larger than the sample data length
    processed_data = preprocessor.load_and_preprocess(sample_data)  # Load the data directly
    sequences, labels = preprocessor.create_sequences(processed_data)

    assert len(sequences) == 0
    assert len(labels) == 0

def test_predictive_maintenance_model_init(preprocessor):
    """Test the initialization of PredictiveMaintenanceModel."""
    model = PredictiveMaintenanceModel(sequence_length=preprocessor.sequence_length, n_features=8) # Adjust n_features as needed
    assert model.sequence_length == preprocessor.sequence_length
    assert model.n_features == 8
    assert isinstance(model.model, tf.keras.models.Sequential)


def test_train_evaluate(sample_data):
    """Test the training and evaluation of the model."""
    # Create a dummy CSV file for testing
    test_csv_path = "test_data.csv"
    sample_data.to_csv(test_csv_path, index=False)
    
    preprocessor = DataPreprocessor(sequence_length=3)
    data = preprocessor.load_and_preprocess(test_csv_path)
    sequences, labels = preprocessor.create_sequences(data)
    
    X = sequences
    y = labels

    model = PredictiveMaintenanceModel(sequence_length=preprocessor.sequence_length, n_features=X.shape[2]) # dynamically adjust n_features

    history = model.train(X, y, epochs=1)
    assert history is not None
    
    metrics = model.evaluate(X, y)
    assert isinstance(metrics, dict)
    assert 'accuracy' in metrics
    assert 'precision' in metrics
    assert 'recall' in metrics
    assert 'f1_score' in metrics
    assert 'confusion_matrix' in metrics
    assert 'classification_report' in metrics
    
    os.remove(test_csv_path)


def test_save_load_model(sample_data):
    """Test saving and loading the model."""
    # Create a dummy CSV file for testing
    test_csv_path = "test_data.csv"
    sample_data.to_csv(test_csv_path, index=False)
    
    preprocessor = DataPreprocessor(sequence_length=3)
    data = preprocessor.load_and_preprocess(test_csv_path)
    sequences, labels = preprocessor.create_sequences(data)
    
    X = sequences
    y = labels
    
    model = PredictiveMaintenanceModel(sequence_length=preprocessor.sequence_length, n_features=X.shape[2]) # dynamically adjust n_features
    
    model.train(X, y, epochs=1)
    
    model.save_model('test_models')
    loaded_model = tf.keras.models.load_model('test_models/predictive_maintenance_model.h5')
    
    assert loaded_model is not None
    
    # Clean up: remove the directory after the test
    shutil.rmtree('test_models')
    os.remove(test_csv_path)

@patch('app.plt.savefig')
def test_plot_training_history(mock_savefig):
    """Test the plot_training_history function."""
    history = {'accuracy': [0.1, 0.2, 0.3], 'val_accuracy': [0.15, 0.25, 0.35], 'loss': [0.9, 0.8, 0.7], 'val_loss': [0.85, 0.75, 0.65]}
    history_object = type('History', (object,), {'history': history})
    plot_training_history(history_object)
    mock_savefig.assert_called_once()


@patch('app.plt.savefig')
def test_plot_confusion_matrix(mock_savefig):
    """Test the plot_confusion_matrix function."""
    conf_matrix = np.array([[10, 2], [1, 15]])
    plot_confusion_matrix(conf_matrix)
    mock_savefig.assert_called_once()


@patch('app.plt.savefig')
def test_analyze_feature_importance(mock_savefig, model):
    """Test the analyze_feature_importance function."""
    feature_names = ['feature1', 'feature2', 'feature3', 'feature4', 'feature5', 'feature6', 'feature7', 'feature8']  # Adjust feature names to match the number of features in the model

    # Create a dummy model instance with required attributes
    analyze_feature_importance(model, feature_names)
    mock_savefig.assert_called_once()
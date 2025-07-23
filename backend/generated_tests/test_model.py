import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
import numpy as np
import tensorflow as tf
from app import PredictiveMaintenanceModel
import os
import shutil
import joblib

# Define a fixture for creating a dummy dataset
@pytest.fixture
def dummy_data():
    sequence_length = 24
    n_features = 8
    num_samples = 100
    
    X = np.random.rand(num_samples, sequence_length, n_features)
    y = np.random.randint(0, 2, num_samples)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    return X_train, X_test, y_train, y_test, sequence_length, n_features

# Define a fixture for creating and cleaning up a model directory
@pytest.fixture
def model_dir():
    model_dir = "test_model_dir"
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
    yield model_dir
    shutil.rmtree(model_dir)

# Test the model building process
def test_build_model():
    model_instance = PredictiveMaintenanceModel()
    assert isinstance(model_instance.model, tf.keras.models.Sequential)

# Test the training functionality
def test_train_model(dummy_data):
    X_train, _, y_train, _, sequence_length, n_features = dummy_data
    model_instance = PredictiveMaintenanceModel(sequence_length=sequence_length, n_features=n_features)
    history = model_instance.train(X_train, y_train, epochs=2, batch_size=32, validation_split=0.2) # Reduced epochs for testing
    assert history is not None
    assert isinstance(history, tf.keras.callbacks.History)

# Test the evaluation functionality
def test_evaluate_model(dummy_data):
    X_train, X_test, y_train, y_test, sequence_length, n_features = dummy_data
    model_instance = PredictiveMaintenanceModel(sequence_length=sequence_length, n_features=n_features)
    model_instance.train(X_train, y_train, epochs=2, batch_size=32, validation_split=0.2) # Train briefly for evaluation
    metrics = model_instance.evaluate(X_test, y_test)
    assert isinstance(metrics, dict)
    assert 'accuracy' in metrics
    assert 'precision' in metrics
    assert 'recall' in metrics
    assert 'f1_score' in metrics
    assert 'confusion_matrix' in metrics
    assert 'classification_report' in metrics

# Test the prediction functionality
def test_predict_single_sequence(dummy_data):
    X_train, _, y_train, _, sequence_length, n_features = dummy_data
    model_instance = PredictiveMaintenanceModel(sequence_length=sequence_length, n_features=n_features)
    model_instance.train(X_train, y_train, epochs=2, batch_size=32, validation_split=0.2)
    
    # Create a single sequence for prediction
    single_sequence = np.random.rand(sequence_length, n_features)
    prediction = model_instance.predict(single_sequence)
    
    assert isinstance(prediction, float)
    assert 0 <= prediction <= 1

def test_predict_reshaped_sequence(dummy_data):
    X_train, _, y_train, _, sequence_length, n_features = dummy_data
    model_instance = PredictiveMaintenanceModel(sequence_length=sequence_length, n_features=n_features)
    model_instance.train(X_train, y_train, epochs=2, batch_size=32, validation_split=0.2)

    single_sequence = np.random.rand(sequence_length, n_features)
    prediction = model_instance.predict(single_sequence)

    assert isinstance(prediction, float)
    assert 0 <= prediction <= 1


# Test the saving and loading functionality
def test_save_load_model(dummy_data, model_dir):
    X_train, _, y_train, _, sequence_length, n_features = dummy_data
    
    # Create and train a model
    model_instance = PredictiveMaintenanceModel(sequence_length=sequence_length, n_features=n_features)
    model_instance.train(X_train, y_train, epochs=2, batch_size=32, validation_split=0.2)
    
    # Save the model
    model_instance.save_model(model_dir)
    
    # Verify that the model files were created
    assert os.path.exists(os.path.join(model_dir, 'lstm_model.h5'))
    assert os.path.exists(os.path.join(model_dir, 'model_params.joblib'))
    
    # Load the model
    loaded_model_instance = PredictiveMaintenanceModel.load_model(model_dir)
    
    # Verify that the loaded model is an instance of the class
    assert isinstance(loaded_model_instance, PredictiveMaintenanceModel)
    
    # Check loaded model parameters
    assert loaded_model_instance.sequence_length == sequence_length
    assert loaded_model_instance.n_features == n_features

#Test model saving when the model directory already exists.
def test_save_model_existing_dir(dummy_data, model_dir):
    X_train, _, y_train, _, sequence_length, n_features = dummy_data

    # Create and train a model
    model_instance = PredictiveMaintenanceModel(sequence_length=sequence_length, n_features=n_features)
    model_instance.train(X_train, y_train, epochs=2, batch_size=32, validation_split=0.2)

    # Call save_model() again, this time the directory exists
    model_instance.save_model(model_dir)

    # Verify that the model files were created
    assert os.path.exists(os.path.join(model_dir, 'lstm_model.h5'))
    assert os.path.exists(os.path.join(model_dir, 'model_params.joblib'))

    # Load the model
    loaded_model_instance = PredictiveMaintenanceModel.load_model(model_dir)

    # Verify that the loaded model is an instance of the class
    assert isinstance(loaded_model_instance, PredictiveMaintenanceModel)

    # Check loaded model parameters
    assert loaded_model_instance.sequence_length == sequence_length
    assert loaded_model_instance.n_features == n_features
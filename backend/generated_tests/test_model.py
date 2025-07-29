import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
import numpy as np
import tensorflow as tf
from ml.preprocessing import DataPreprocessor
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


import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import os

class PredictiveMaintenanceModel:
    def __init__(self, sequence_length=24, n_features=8):
        self.sequence_length = sequence_length
        self.n_features = n_features
        self.model = self._build_model()
        
    def _build_model(self):
        """Build LSTM model architecture"""
        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(64, input_shape=(self.sequence_length, self.n_features), 
                               return_sequences=True),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.LSTM(32),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(16, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self, X_train, y_train, validation_split=0.2, epochs=50, batch_size=32):
        """Train the model"""
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=5,
            restore_best_weights=True
        )
        
        history = self.model.fit(
            X_train, y_train,
            validation_split=validation_split,
            epochs=epochs,
            batch_size=batch_size,
            callbacks=[early_stopping],
            verbose=1
        )
        
        return history
    
    def evaluate(self, X_test, y_test):
        """Evaluate model performance"""
        # Get predictions
        y_pred_proba = self.model.predict(X_test)
        y_pred = (y_pred_proba > 0.5).astype(int)
        
        # Calculate metrics
        report = classification_report(y_test, y_pred)
        conf_matrix = confusion_matrix(y_test, y_pred)
        
        # Calculate additional metrics
        accuracy = np.mean(y_test == y_pred)
        precision = conf_matrix[1,1] / (conf_matrix[1,1] + conf_matrix[0,1])
        recall = conf_matrix[1,1] / (conf_matrix[1,1] + conf_matrix[1,0])
        f1_score = 2 * (precision * recall) / (precision + recall)
        
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1_score,
            'confusion_matrix': conf_matrix,
            'classification_report': report
        }
        
        return metrics
    
    def predict(self, sequence):
        """Make predictions for a single sequence"""
        if len(sequence.shape) == 2:
            sequence = np.expand_dims(sequence, axis=0)
        
        prediction = self.model.predict(sequence)
        return prediction[0][0]
    
    def save_model(self, model_dir):
        """Save the trained model"""
        if not os.path.exists(model_dir):
            os.makedirs(model_dir)
            
        # Save Keras model
        model_path = os.path.join(model_dir, 'lstm_model.h5')
        self.model.save(model_path)
        
        # Save model parameters
        params = {
            'sequence_length': self.sequence_length,
            'n_features': self.n_features
        }
        params_path = os.path.join(model_dir, 'model_params.joblib')
        joblib.dump(params, params_path)
    
    @classmethod
    def load_model(cls, model_dir):
        """Load a trained model"""
        # Load model parameters
        params_path = os.path.join(model_dir, 'model_params.joblib')
        params = joblib.load(params_path)
        
        # Create instance with loaded parameters
        instance = cls(
            sequence_length=params['sequence_length'],
            n_features=params['n_features']
        )
        
        # Load Keras model
        model_path = os.path.join(model_dir, 'lstm_model.h5')
        instance.model = tf.keras.models.load_model(model_path)
        
        return instance 
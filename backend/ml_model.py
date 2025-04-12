import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime, timedelta
import os
import joblib

class PredictiveMaintenanceModel:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.sequence_length = 10  # Number of time steps to look back
        
        # Data paths
        self.BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.DATA_DIR = os.path.join(self.BASE_DIR, 'data')
        self.RAW_DATA_DIR = os.path.join(self.DATA_DIR, 'raw')
        self.PROCESSED_DATA_DIR = os.path.join(self.DATA_DIR, 'processed')
        self.MODELS_DIR = os.path.join(self.DATA_DIR, 'models')
        
        # Create directories if they don't exist
        os.makedirs(self.PROCESSED_DATA_DIR, exist_ok=True)
        os.makedirs(self.MODELS_DIR, exist_ok=True)
        
    def load_data(self):
        """Load data from CSV files"""
        sensor_data = pd.read_csv(os.path.join(self.RAW_DATA_DIR, 'sensor_data.csv'))
        log_data = pd.read_csv(os.path.join(self.RAW_DATA_DIR, 'log_data.csv'))
        return sensor_data, log_data
        
    def prepare_data(self, sensor_data, log_data):
        # Convert timestamps
        sensor_data['timestamp'] = pd.to_datetime(sensor_data['timestamp'])
        log_data['timestamp'] = pd.to_datetime(log_data['timestamp'])
        
        # Sort by timestamp
        sensor_data = sensor_data.sort_values('timestamp')
        log_data = log_data.sort_values('timestamp')
        
        # Create features
        features = []
        labels = []
        
        # Process sensor data
        for device_id in sensor_data['device_id'].unique():
            device_sensors = sensor_data[sensor_data['device_id'] == device_id]
            device_logs = log_data[log_data['device_id'] == device_id]
            
            if len(device_sensors) <= self.sequence_length:
                continue
                
            # Create sequences
            for i in range(len(device_sensors) - self.sequence_length):
                sequence = device_sensors.iloc[i:i+self.sequence_length]
                
                # Extract features
                sensor_values = sequence['sensor_value'].values.reshape(-1, 1)
                threshold_breaches = sequence['threshold_breach'].values.reshape(-1, 1)
                
                # Get corresponding logs
                start_time = sequence.iloc[0]['timestamp']
                end_time = sequence.iloc[-1]['timestamp']
                relevant_logs = device_logs[
                    (device_logs['timestamp'] >= start_time) & 
                    (device_logs['timestamp'] <= end_time)
                ]
                
                # Calculate log-based features
                log_features = np.array([
                    len(relevant_logs),
                    relevant_logs['event_severity'].mean() if not relevant_logs.empty else 0,
                    relevant_logs['event_severity'].max() if not relevant_logs.empty else 0
                ]).reshape(1, -1)
                
                # Combine features for each timestep
                timestep_features = np.concatenate([sensor_values, threshold_breaches], axis=1)
                
                # Add log features to each timestep
                timestep_features = np.concatenate([
                    timestep_features,
                    np.tile(log_features, (self.sequence_length, 1))
                ], axis=1)
                
                features.append(timestep_features)
                
                # Label (1 if next reading has threshold breach, 0 otherwise)
                next_reading = device_sensors.iloc[i+self.sequence_length]
                labels.append(1 if next_reading['threshold_breach'] else 0)
        
        features = np.array(features)
        labels = np.array(labels)
        
        return features, labels
    
    def build_model(self, input_shape):
        model = Sequential([
            LSTM(64, input_shape=input_shape, return_sequences=True),
            Dropout(0.2),
            LSTM(32),
            Dropout(0.2),
            Dense(16, activation='relu'),
            Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self):
        # Load data
        sensor_data, log_data = self.load_data()
        
        # Prepare data
        X, y = self.prepare_data(sensor_data, log_data)
        
        # Scale features - reshape to 2D for scaling
        X_reshaped = X.reshape(X.shape[0], -1)
        X_scaled = self.scaler.fit_transform(X_reshaped)
        X = X_scaled.reshape(X.shape)
        
        # Save scaler
        joblib.dump(self.scaler, os.path.join(self.MODELS_DIR, 'scaler.joblib'))
        
        # Split data into train and validation sets
        train_size = int(0.8 * len(X))
        X_train, X_val = X[:train_size], X[train_size:]
        y_train, y_val = y[:train_size], y[train_size:]
        
        # Build and train model
        self.model = self.build_model((self.sequence_length, X.shape[2]))
        
        # Add early stopping
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=3,
            restore_best_weights=True
        )
        
        # Train model with callbacks
        history = self.model.fit(
            X_train, y_train,
            epochs=10,
            batch_size=32,
            validation_data=(X_val, y_val),
            callbacks=[early_stopping]
        )
        
        # Evaluate model
        val_loss, val_accuracy = self.model.evaluate(X_val, y_val)
        print(f"\nValidation Loss: {val_loss:.4f}")
        print(f"Validation Accuracy: {val_accuracy:.4f}")
        
        # Save model
        self.model.save(os.path.join(self.MODELS_DIR, 'predictive_model.h5'))
        
        # Save training history
        history_df = pd.DataFrame(history.history)
        history_df.to_csv(os.path.join(self.MODELS_DIR, 'training_history.csv'))
        
        return history.history
    
    def load_model(self):
        """Load trained model and scaler"""
        model_path = os.path.join(self.MODELS_DIR, 'predictive_model.h5')
        scaler_path = os.path.join(self.MODELS_DIR, 'scaler.joblib')
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            self.model = tf.keras.models.load_model(model_path)
            self.scaler = joblib.load(scaler_path)
            return True
        return False
    
    def predict(self, sensor_data, log_data):
        X, _ = self.prepare_data(sensor_data, log_data)
        X = self.scaler.transform(X)
        X = X.reshape((X.shape[0], self.sequence_length, -1))
        
        predictions = self.model.predict(X)
        return predictions
    
    def generate_alerts(self, predictions, sensor_data, threshold=0.7):
        alerts = []
        for i, pred in enumerate(predictions):
            if pred > threshold:
                device_id = sensor_data.iloc[i]['device_id']
                alert = {
                    'timestamp': datetime.now().isoformat(),
                    'device_id': device_id,
                    'alert_type': 'PREDICTIVE_MAINTENANCE',
                    'severity': int(pred * 10),  # Scale to 1-10
                    'message': f'High probability of device failure detected for {device_id}',
                    'details': {
                        'probability': float(pred),
                        'sensor_readings': sensor_data.iloc[i].to_dict(),
                        'recommended_action': 'Schedule maintenance check'
                    }
                }
                alerts.append(alert)
        return alerts 
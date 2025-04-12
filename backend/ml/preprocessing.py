import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from datetime import datetime, timedelta

class DataPreprocessor:
    def __init__(self):
        self.scalers = {}
        self.label_encoders = {}
        self.sequence_length = 24  # 24 hours of data for sequence prediction
        
    def load_and_preprocess(self, file_path):
        """Load and preprocess the raw data"""
        # Load data
        df = pd.read_csv(file_path)
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Sort by timestamp
        df = df.sort_values('timestamp')
        
        # Handle missing values
        df['sensor_value'] = df['sensor_value'].fillna(method='ffill')
        df['threshold_breach'] = df['threshold_breach'].fillna(False)
        
        # Create binary labels for threshold breaches
        df['threshold_breach'] = df['threshold_breach'].astype(int)
        
        # Encode categorical variables
        categorical_columns = ['device_id', 'component_type', 'sensor_type', 'location']
        for col in categorical_columns:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
            df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col])
        
        # Extract time-based features
        df['hour'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['month'] = df['timestamp'].dt.month
        
        # Scale numerical features
        numerical_columns = ['sensor_value', 'hour', 'day_of_week', 'month']
        for col in numerical_columns:
            if col not in self.scalers:
                self.scalers[col] = StandardScaler()
            df[f'{col}_scaled'] = self.scalers[col].fit_transform(df[[col]])
        
        return df
    
    def create_sequences(self, df, target_device=None):
        """Create sequences for LSTM model"""
        if target_device:
            df = df[df['device_id'] == target_device]
        
        # Features for sequence
        feature_columns = [
            'sensor_value_scaled',
            'hour_scaled',
            'day_of_week_scaled',
            'month_scaled',
            'device_id_encoded',
            'component_type_encoded',
            'sensor_type_encoded',
            'location_encoded'
        ]
        
        sequences = []
        labels = []
        
        for device in df['device_id'].unique():
            device_data = df[df['device_id'] == device].sort_values('timestamp')
            
            for i in range(len(device_data) - self.sequence_length):
                sequence = device_data[feature_columns].iloc[i:i + self.sequence_length].values
                label = device_data['threshold_breach'].iloc[i + self.sequence_length]
                sequences.append(sequence)
                labels.append(label)
        
        return np.array(sequences), np.array(labels)
    
    def calculate_device_health(self, df, device_id, current_time=None):
        """Calculate device health score based on recent data"""
        if current_time is None:
            current_time = df['timestamp'].max()
        
        # Get last 24 hours of data for the device
        time_threshold = current_time - timedelta(hours=24)
        recent_data = df[
            (df['device_id'] == device_id) & 
            (df['timestamp'] >= time_threshold)
        ]
        
        if recent_data.empty:
            return 100  # Default score if no recent data
        
        # Calculate health score components
        breach_ratio = 1 - recent_data['threshold_breach'].mean()
        
        # Calculate sensor value volatility
        sensor_volatility = 1 - min(recent_data['sensor_value'].std() / 100, 0.5)
        
        # Combine components for final health score
        health_score = (breach_ratio * 0.7 + sensor_volatility * 0.3) * 100
        
        return round(max(min(health_score, 100), 0), 2)
    
    def detect_anomalies(self, df, device_id, threshold=3):
        """Detect anomalies using Z-score method"""
        device_data = df[df['device_id'] == device_id]
        
        # Calculate z-scores for sensor values
        z_scores = np.abs((device_data['sensor_value'] - device_data['sensor_value'].mean()) / 
                         device_data['sensor_value'].std())
        
        # Mark anomalies
        anomalies = device_data[z_scores > threshold].copy()
        anomalies['anomaly_score'] = z_scores[z_scores > threshold]
        
        return anomalies
    
    def get_maintenance_prediction(self, df, device_id):
        """Predict next maintenance time based on threshold breaches"""
        device_data = df[df['device_id'] == device_id].sort_values('timestamp')
        
        if len(device_data) < self.sequence_length:
            return None
        
        # Calculate breach frequency
        recent_breaches = device_data['threshold_breach'].rolling(window=self.sequence_length).mean().iloc[-1]
        
        if recent_breaches > 0.2:  # If more than 20% breaches in recent window
            return "Immediate maintenance recommended"
        elif recent_breaches > 0.1:  # If more than 10% breaches
            return "Maintenance recommended within 48 hours"
        else:
            return "No immediate maintenance required" 
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime, timedelta
import os
import joblib
import random

Sequential = keras.models.Sequential
LSTM = keras.layers.LSTM
Dense = keras.layers.Dense
Dropout = keras.layers.Dropout

class PredictiveMaintenanceModel:
    def __init__(self):
        self.model = None
        self.scaler = MinMaxScaler()
        self.sequence_length = 10  # Number of time steps to look back
        self.gpt_model = None  # Will be initialized when needed
        
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
            # Load model with custom_objects to handle compatibility issues
            self.model = tf.keras.models.load_model(
                model_path,
                custom_objects={
                    'LSTM': lambda *args, **kwargs: tf.keras.layers.LSTM(*args, **{k: v for k, v in kwargs.items() if k != 'time_major'})
                }
            )
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

    def analyze_causes_with_gpt(self, alert, device_data):
        """Analyze potential causes using GPT model"""
        try:
            # Prepare the prompt for GPT
            prompt = f"""
            Analyze the following alert and device information to determine potential causes:
            
            Alert Details:
            - Message: {alert.get('message', 'No message')}
            - Severity: {alert.get('severity', 'Unknown')}
            - Type: {alert.get('type', 'Unknown')}
            
            Device Information:
            - Type: {device_data.get('type', 'Unknown')}
            - Location: {device_data.get('location', 'Unknown')}
            - Status: {device_data.get('status', 'Unknown')}
            
            Please provide a list of potential causes for this alert, focusing on:
            1. Hardware-related issues
            2. Software-related issues
            3. Environmental factors
            4. Operational issues
            
            Format the response as a list of causes, one per line.
            """
            
            # In a real implementation, you would call a GPT API here
            # For now, we'll return mock responses based on alert type
            if "temperature" in alert.get('message', '').lower():
                return [
                    "Cooling system malfunction",
                    "Airflow obstruction",
                    "Thermal sensor failure",
                    "HVAC system issues"
                ]
            elif "humidity" in alert.get('message', '').lower():
                return [
                    "Humidity control system failure",
                    "Water leakage",
                    "Environmental conditions",
                    "Sensor calibration issues"
                ]
            elif "power" in alert.get('message', '').lower():
                return [
                    "Power supply instability",
                    "Voltage fluctuations",
                    "Circuit overload",
                    "Backup power system issues"
                ]
            else:
                return [
                    "Component wear and tear",
                    "System configuration issues",
                    "Environmental stress",
                    "Operational overload"
                ]
        except Exception as e:
            print(f"Error in analyze_causes_with_gpt: {str(e)}")
            return ["Unable to analyze causes at this time"]

    def predict_resource_requirements_with_gpt(self, alert, device_data, causes):
        """Predict required resources using GPT model"""
        try:
            # Prepare the prompt for GPT
            prompt = f"""
            Based on the following alert, device information, and potential causes,
            determine the required resources for maintenance:
            
            Alert Details:
            - Message: {alert.get('message', 'No message')}
            - Severity: {alert.get('severity', 'Unknown')}
            - Type: {alert.get('type', 'Unknown')}
            
            Device Information:
            - Type: {device_data.get('type', 'Unknown')}
            - Location: {device_data.get('location', 'Unknown')}
            - Status: {device_data.get('status', 'Unknown')}
            
            Potential Causes:
            {chr(10).join(causes)}
            
            Please provide a list of required resources in the format:
            resource_name: quantity
            
            Include:
            1. Personnel requirements
            2. Equipment/tools needed
            3. Spare parts
            4. Specialized resources
            """
            
            # In a real implementation, you would call a GPT API here
            # For now, we'll return mock responses based on alert type
            if "temperature" in alert.get('message', '').lower():
                return {
                    "HVAC_technicians": 2,
                    "Thermal_sensors": 1,
                    "Cooling_fans": 2,
                    "Thermal_paste": 1
                }
            elif "humidity" in alert.get('message', '').lower():
                return {
                    "Maintenance_technicians": 1,
                    "Humidity_sensors": 1,
                    "Dehumidifiers": 1,
                    "Sealant_materials": 1
                }
            elif "power" in alert.get('message', '').lower():
                return {
                    "Electricians": 2,
                    "Voltage_meters": 1,
                    "Power_supplies": 1,
                    "Circuit_testers": 1
                }
            else:
                return {
                    "Maintenance_technicians": 1,
                    "Diagnostic_tools": 1,
                    "Replacement_parts": 1,
                    "Safety_equipment": 1
                }
        except Exception as e:
            print(f"Error in predict_resource_requirements_with_gpt: {str(e)}")
            return {}

    def analyze_causes(self, alert):
        """Analyze potential causes using LSTM model"""
        try:
            # Get device data
            device_id = alert.get("device_id", "unknown")
            device_data = self.get_device_data(device_id)
            
            # Use GPT for cause analysis
            causes = self.analyze_causes_with_gpt(alert, device_data)
            
            if not causes:  # If no causes were found, return default causes
                return [
                    "System performance degradation",
                    "Regular maintenance required",
                    "Component wear and tear"
                ]
                
            return causes
        except Exception as e:
            print(f"Error in analyze_causes: {str(e)}")
            return [
                "System performance degradation",
                "Regular maintenance required",
                "Component wear and tear"
            ]

    def predict_root_cause(self, alert):
        """Predict the root cause of an alert"""
        try:
            message = alert.get("message", "").lower()
            
            if "temperature" in message:
                return "Temperature control system malfunction"
            elif "humidity" in message:
                return "Humidity regulation system issue"
            elif "network" in message:
                return "Network connectivity degradation"
            elif "power" in message:
                return "Power supply instability"
            elif "cooling" in message:
                return "Cooling system inefficiency"
            else:
                return "System performance deviation from normal parameters"
                
        except Exception as e:
            print(f"Error in predict_root_cause: {str(e)}")
            return "System performance deviation from normal parameters"

    def predict_resource_requirements(self, alert, device):
        """Predict required resources based on alert and device type"""
        try:
            # Get causes first
            causes = self.analyze_causes(alert)
            
            # Use GPT for resource prediction
            requirements = self.predict_resource_requirements_with_gpt(alert, device, causes)
            
            if not requirements:  # If no requirements were found, return default requirements
                return {
                    "maintenance_technician": 1,
                    "diagnostic_tools": 1,
                    "spare_parts": 1
                }
                
            return requirements
        except Exception as e:
            print(f"Error in predict_resource_requirements: {str(e)}")
            return {
                "maintenance_technician": 1,
                "diagnostic_tools": 1,
                "spare_parts": 1
            }

    def get_recent_sensor_data(self, device_id):
        """Get recent sensor data for a device"""
        # This would be implemented to fetch actual sensor data
        # For demo, return mock data
        return [
            {"timestamp": datetime.now().isoformat(), "value": random.uniform(0, 100)}
            for _ in range(10)
        ]

    def prepare_sequence_data(self, sensor_data):
        """Prepare sensor data for LSTM input"""
        # Convert to numpy array and reshape for LSTM
        values = np.array([d["value"] for d in sensor_data])
        return values.reshape(1, len(values), 1)

    def get_device_data(self, device_id):
        """Get device data"""
        # This would be implemented to fetch actual device data
        # For demo, return mock data
        return {
            "type": "HVAC",
            "status": "operational",
            "location": "Server Room"
        }

    def analyze_sensor_data(self, sensor_data):
        """Analyze sensor data for anomalies"""
        # This would be implemented to analyze actual sensor data
        # For demo, return mock analysis
        return {
            "temperature": "normal",
            "humidity": "normal",
            "power": "normal"
        }

    def generate_maintenance_plan(self, alert, device, analysis):
        """Generate a maintenance plan based on alert, device and analysis data"""
        try:
            # Prepare context for GPT
            context = {
                "alert_type": alert.get("type", "unknown"),
                "severity": alert.get("severity", "unknown"),
                "device_type": device.get("type", "unknown"),
                "root_cause": analysis.root_cause,
                "causes": analysis.causes
            }

            # In a real implementation, this would use GPT API
            # For now, return structured mock data based on context
            if "temperature" in str(analysis.root_cause).lower():
                return {
                    "steps": [
                        "1. Power down the affected system",
                        "2. Inspect cooling fans and heat sinks",
                        "3. Clean any dust or debris",
                        "4. Check thermal paste application",
                        "5. Test system temperatures after restart"
                    ],
                    "preventative_measures": [
                        "Regular cleaning schedule",
                        "Temperature monitoring alerts",
                        "Airflow optimization",
                        "Regular thermal paste replacement"
                    ],
                    "estimated_time": 120,
                    "required_tools": [
                        "Thermal paste",
                        "Cleaning supplies",
                        "Temperature monitoring tools",
                        "Screwdrivers"
                    ],
                    "skill_level": "Intermediate"
                }
            elif "power" in str(analysis.root_cause).lower():
                return {
                    "steps": [
                        "1. Check power supply connections",
                        "2. Test voltage levels",
                        "3. Inspect circuit breakers",
                        "4. Verify UPS functionality",
                        "5. Test under load conditions"
                    ],
                    "preventative_measures": [
                        "Regular power quality monitoring",
                        "UPS maintenance schedule",
                        "Backup power testing",
                        "Load balancing review"
                    ],
                    "estimated_time": 90,
                    "required_tools": [
                        "Multimeter",
                        "Power supply tester",
                        "Safety equipment",
                        "Spare cables"
                    ],
                    "skill_level": "Advanced"
                }
            else:
                return {
                    "steps": [
                        "1. Diagnose system status",
                        "2. Check error logs",
                        "3. Test component functionality",
                        "4. Replace or repair as needed",
                        "5. Verify system operation"
                    ],
                    "preventative_measures": [
                        "Regular maintenance schedule",
                        "System monitoring",
                        "Component lifecycle tracking",
                        "Staff training"
                    ],
                    "estimated_time": 60,
                    "required_tools": [
                        "Diagnostic tools",
                        "Basic tool kit",
                        "Spare parts",
                        "Testing equipment"
                    ],
                    "skill_level": "Intermediate"
                }
        except Exception as e:
            print(f"Error generating maintenance plan: {str(e)}")
            return {
                "steps": ["System maintenance required"],
                "preventative_measures": ["Regular system checks"],
                "estimated_time": 60,
                "required_tools": ["Basic tool kit"],
                "skill_level": "Basic"
            } 
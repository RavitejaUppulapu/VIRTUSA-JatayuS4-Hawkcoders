import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import os

# Set random seed for reproducibility
random.seed(42)
np.random.seed(42)

# ----------------------------
# Configurations and settings
# ----------------------------
num_sensor_records = 500  # Number of sensor records to generate
num_log_records = 200     # Number of log records to generate

# Device and location options
device_ids = [f"dev_{i}" for i in range(1, 11)]  # 10 devices: dev_1, dev_2, …, dev_10
component_types = ["ATM", "Server", "AC_Unit", "UPS"]
locations = ["Hyderabad", "Mumbai", "Bangalore", "Chennai", "Delhi"]

# Sensor types along with predefined threshold values (adjust as needed)
sensor_types = {
    "temperature": 75,
    "humidity": 70,
    "vibration": 5.0,
    "power": 230
}

# ----------------------------
# Generate Synthetic Sensor Data
# ----------------------------
sensor_records = []

for _ in range(num_sensor_records):
    # Random timestamp within the past 30 days
    timestamp = datetime.now() - timedelta(
        days=random.randint(0, 30), 
        hours=random.randint(0, 23), 
        minutes=random.randint(0, 59)
    )
    device_id = random.choice(device_ids)
    component_type = random.choice(component_types)
    sensor_type = random.choice(list(sensor_types.keys()))
    
    # Generate sensor values based on the sensor type with a normal distribution
    if sensor_type == "temperature":
        value = round(np.random.normal(65, 8), 2)
    elif sensor_type == "humidity":
        value = round(np.random.normal(55, 10), 2)
    elif sensor_type == "vibration":
        value = round(np.random.normal(2.5, 1), 2)
    elif sensor_type == "power":
        value = round(np.random.normal(220, 15), 2)
    
    # Determine if the sensor value crosses its threshold
    threshold_breach = value > sensor_types[sensor_type]
    location = random.choice(locations)
    
    sensor_records.append({
        "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "device_id": device_id,
        "component_type": component_type,
        "sensor_type": sensor_type,
        "sensor_value": value,
        "threshold_breach": threshold_breach,
        "location": location
    })

# ----------------------------
# Define Log Message Elements
# ----------------------------
# For different types of logs, we prepare a few preset messages and error codes.
atm_log_messages = [
    "Cash dispenser error", "Card reader malfunction", 
    "Network timeout", "Printer error", "General log: operation normal"
]
server_log_messages = [
    "High CPU usage detected", "Memory leak suspected", 
    "Disk failure warning", "Unexpected shutdown", "General log: system healthy"
]
iot_log_messages = [
    "Sensor calibration needed", "Battery low", 
    "Signal lost", "Intermittent connectivity", "General log: stable"
]

error_codes_atm = ["ATM_E001", "ATM_E002", "ATM_E003"]
error_codes_server = ["SRV_E101", "SRV_E102", "SRV_E103"]
error_codes_iot = ["IOT_E201", "IOT_E202", "IOT_E203"]

# ----------------------------
# Generate Synthetic Log Data
# ----------------------------
log_records = []

for _ in range(num_log_records):
    # Random timestamp within the past 30 days
    timestamp = datetime.now() - timedelta(
        days=random.randint(0, 30), 
        hours=random.randint(0, 23), 
        minutes=random.randint(0, 59)
    )
    device_id = random.choice(device_ids)
    component_type = random.choice(component_types)
    location = random.choice(locations)
    
    # Randomly select the type of log record
    log_type = random.choice(["ATM_log", "Server_log", "IOT_log"])
    
    if log_type == "ATM_log":
        log_message = random.choice(atm_log_messages)
        event_severity = random.randint(1, 3)  # Moderate severity for ATM-related logs
        # Set an error code only if message implies an error condition
        error_code = random.choice(error_codes_atm) if any(key in log_message.lower() for key in ["error", "malfunction"]) else np.nan
        performance_metrics = np.nan
        
    elif log_type == "Server_log":
        log_message = random.choice(server_log_messages)
        event_severity = random.randint(2, 5)  # Typically higher severity for server issues
        error_code = random.choice(error_codes_server) if any(key in log_message.lower() for key in ["failure", "error"]) else np.nan
        # Include simulated performance metrics for server logs
        cpu_usage = round(np.random.uniform(70, 100), 2)
        mem_usage = round(np.random.uniform(60, 100), 2)
        performance_metrics = f"CPU:{cpu_usage}%, MEM:{mem_usage}%"
        
    elif log_type == "IOT_log":
        log_message = random.choice(iot_log_messages)
        event_severity = random.randint(1, 3)
        error_code = random.choice(error_codes_iot) if any(key in log_message.lower() for key in ["lost", "low"]) else np.nan
        performance_metrics = np.nan

    # Create log record
    log_records.append({
        "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
        "device_id": device_id,
        "component_type": component_type,
        "log_type": log_type,
        "log_message": log_message,
        "event_severity": event_severity,
        "error_code": error_code,
        "performance_metrics": performance_metrics,
        "location": location
    })

# ----------------------------
# Save the Datasets
# ----------------------------
# Create data directories if they don't exist
os.makedirs('data/raw', exist_ok=True)
os.makedirs('data/processed', exist_ok=True)
os.makedirs('data/models', exist_ok=True)

# Save sensor data
df_sensor = pd.DataFrame(sensor_records)
df_sensor.to_csv('data/raw/sensor_data.csv', index=False)
print(f"Sensor data saved to data/raw/sensor_data.csv")

# Save log data
df_log = pd.DataFrame(log_records)
df_log.to_csv('data/raw/log_data.csv', index=False)
print(f"Log data saved to data/raw/log_data.csv")

# Combine and save for reference
df_combined = pd.concat([df_sensor, df_log], ignore_index=True)
df_combined.to_csv('data/raw/combined_data.csv', index=False)
print(f"Combined data saved to data/raw/combined_data.csv") 
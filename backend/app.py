from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from ml_model import PredictiveMaintenanceModel
import json
import os
import uuid
import random
from enum import Enum
from fastapi_utils.tasks import repeat_every
from fastapi.responses import Response
from dateutil.parser import parse

app = FastAPI(title="Predictive Maintenance API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize model
model = PredictiveMaintenanceModel()
model.load_model()

# Global variables to store mock data
devices = {}
sensor_history = {}
alerts = []
failures = []  # Initialize as empty list
settings = {
    "thresholds": {
        "temperature": {"warning": 65, "critical": 75},
        "humidity": {"warning": 70, "critical": 85},
        "vibration": {"warning": 4.0, "critical": 5.0}
    },
    "notifications": {
        "email": True,
        "sms": False
    }
}

def generate_mock_alerts():
    """Generate mock alerts for testing"""
    mock_alerts = []
    messages = [
        "Abnormal behavior detected in humidity sensor",
        "Abnormal behavior detected in temperature sensor",
        "Abnormal behavior detected in network interface",
        "Abnormal behavior detected in power supply",
        "Abnormal behavior detected in cooling system"
    ]
    
    # Generate alerts for the past 7 days
    for i in range(10):
        severity = random.randint(1, 10)
        device_id = f"device_{random.randint(1, 5)}"  # Ensure this matches with mock devices
        
        alert = {
            "id": str(uuid.uuid4()),
            "timestamp": (datetime.now() - timedelta(days=random.randint(0, 6))).isoformat(),
            "device_id": device_id,
            "type": "critical" if severity >= 7 else "warning",
            "severity": severity,
            "message": random.choice(messages),
            "acknowledged": False  # All new alerts start as unresolved
        }
        mock_alerts.append(alert)
    return mock_alerts

def generate_sensor_history(device_id=None):
    """Generate mock sensor history for each device or a specific device if device_id is provided"""
    current_time = datetime.now()
    
    if device_id:
        device_ids = [device_id] if device_id in devices else []
    else:
        device_ids = devices.keys()

    for device_id in device_ids:
        sensor_history[device_id] = []
        base_values = devices[device_id]["sensors"]
        
        # Generate readings from oldest to newest
        for i in range(9, -1, -1):  # 9 to 0, to generate oldest to newest
            reading_time = current_time - timedelta(minutes=i*5)
            reading = {
                "timestamp": reading_time.strftime("%H:%M"),
                "raw_timestamp": reading_time.isoformat(),
                "index": 9-i  # Add index for proper ordering
            }
            
            # Add each sensor with device-specific variations
            for sensor_name, base_value in base_values.items():
                # Generate variations based on device type and sensor
                variation = 0
                if devices[device_id]["type"].lower() == "hvac":
                    if sensor_name == "temperature":
                        variation = random.uniform(-2, 2)
                    elif sensor_name == "humidity":
                        variation = random.uniform(-5, 5)
                    else:
                        variation = random.uniform(-0.1, 0.1) * base_value
                elif devices[device_id]["type"].lower() == "power":
                    if sensor_name in ["voltage", "current"]:
                        variation = random.uniform(-0.05, 0.05) * base_value
                    else:
                        variation = random.uniform(-0.1, 0.1) * base_value
                elif devices[device_id]["type"].lower() == "network":
                    if sensor_name == "packet_loss":
                        variation = random.uniform(-0.01, 0.01)
                    elif sensor_name == "bandwidth":
                        variation = random.uniform(-50, 50)
                    else:
                        variation = random.uniform(-0.1, 0.1) * base_value
                elif devices[device_id]["type"].lower() == "storage":
                    if sensor_name == "disk_usage":
                        variation = random.uniform(-0.5, 0.5)
                    elif sensor_name == "read_latency":
                        variation = random.uniform(-0.2, 0.2)
                    else:
                        variation = random.uniform(-0.1, 0.1) * base_value
                else:
                    variation = random.uniform(-0.1, 0.1) * base_value
                
                # Ensure values stay within reasonable bounds
                if sensor_name == "temperature":
                    reading[sensor_name] = round(max(0, min(100, base_value + variation)), 2)
                elif sensor_name == "humidity":
                    reading[sensor_name] = round(max(0, min(100, base_value + variation)), 2)
                elif sensor_name == "packet_loss":
                    reading[sensor_name] = round(max(0, min(100, base_value + variation)), 2)
                elif sensor_name == "disk_usage":
                    reading[sensor_name] = round(max(0, min(100, base_value + variation)), 2)
                elif sensor_name == "fuel_level":
                    reading[sensor_name] = round(max(0, min(100, base_value + variation)), 2)
                else:
                    reading[sensor_name] = round(base_value + variation, 2)
            
            sensor_history[device_id].append(reading)
        
        # Sort by index to ensure proper ordering (oldest to newest)
        sensor_history[device_id].sort(key=lambda x: x["index"])
        # Remove the index field as it's no longer needed
        for reading in sensor_history[device_id]:
            reading.pop("index", None)
    
    return sensor_history

def generate_mock_failures():
    """Generate mock failure data for the application"""
    components = ["CPU", "Memory", "Storage", "Power Supply", "Network Card", "Cooling Fan"]
    descriptions = [
        "High temperature detected",
        "Memory usage exceeding threshold",
        "Disk space critically low",
        "Power fluctuations detected",
        "Network connectivity issues",
        "Cooling system malfunction"
    ]
    technicians = ["John Smith", "Alice Johnson", "Bob Wilson", None]
    statuses = ["open", "in_progress", "resolved"]
    
    mock_failures = []
    for _ in range(20):  # Generate more failures for better data
        status = random.choice(statuses)
        failure = {
            "id": str(uuid.uuid4()),
            "type": random.choice(["hardware", "software"]),
            "device_id": f"DEV{random.randint(1, 5):03d}",
            "component": random.choice(components),
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "description": random.choice(descriptions),
            "timestamp": (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat(),
            "status": status,
            "resolution_time": random.uniform(1, 24) if status == "resolved" else None,
            "technician": random.choice(technicians) if status != "open" else None,
            "resolution_notes": "Issue resolved by replacing component" if status == "resolved" else None
        }
        mock_failures.append(failure)
    
    return mock_failures

def init_mock_data():
    """Initialize mock data for the application"""
    global devices, alerts, sensor_history, failures
    
    # Initialize mock devices with more realistic base values
    devices = {
        "device_1": {
            "id": "device_1",
            "name": "Server Room AC",
            "location": "Server Room",
            "type": "HVAC",
            "status": "operational",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 22.5,
                "humidity": 45.0,
                "power": 5.2
            },
            "metrics": {
                "mtbf": 720,  # 30 days in hours
                "mttr": 4,    # 4 hours
                "oee": 0.95   # 95%
            }
        },
        "device_2": {
            "id": "device_2",
            "name": "Main Power Unit",
            "location": "Electrical Room",
            "type": "Power",
            "status": "operational",
            "last_check": datetime.now(),
            "sensors": {
                "voltage": 220.0,
                "current": 15.0,
                "temperature": 35.0
            },
            "metrics": {
                "mtbf": 840,  # 35 days in hours
                "mttr": 6,    # 6 hours
                "oee": 0.92   # 92%
            }
        },
        "device_3": {
            "id": "device_3",
            "name": "Network Switch",
            "location": "Server Room",
            "type": "Network",
            "status": "operational",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 28.0,
                "packet_loss": 0.1,
                "bandwidth": 850.0
            },
            "metrics": {
                "mtbf": 960,  # 40 days in hours
                "mttr": 2,    # 2 hours
                "oee": 0.98   # 98%
            }
        },
        "device_4": {
            "id": "device_4",
            "name": "Backup Generator",
            "location": "Outside",
            "type": "Power",
            "status": "standby",
            "last_check": datetime.now(),
            "sensors": {
                "fuel_level": 95.0,
                "temperature": 30.0,
                "oil_pressure": 40.0
            },
            "metrics": {
                "mtbf": 1200,  # 50 days in hours
                "mttr": 8,     # 8 hours
                "oee": 0.90    # 90%
            }
        },
        "device_5": {
            "id": "device_5",
            "name": "Storage Array",
            "location": "Server Room",
            "type": "Storage",
            "status": "operational",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 25.0,
                "disk_usage": 68.0,
                "read_latency": 2.5
            },
            "metrics": {
                "mtbf": 1080,  # 45 days in hours
                "mttr": 3,     # 3 hours
                "oee": 0.96    # 96%
            }
        }
    }
    
    alerts = generate_mock_alerts()
    sensor_history = generate_sensor_history()
    failures = generate_mock_failures()

# Initialize mock data when the server starts
init_mock_data()

class Device(BaseModel):
    id: str
    name: str
    location: str
    type: str
    status: str
    last_check: datetime
    sensors: Dict[str, float]

class PredictionRequest(BaseModel):
    device_id: str
    sensor_data: List[dict]
    log_data: List[dict]

class AlertResponse(BaseModel):
    id: str
    timestamp: str
    device_id: str
    alert_type: str
    severity: int
    message: str
    details: dict
    acknowledged: bool = False

class ThresholdSettings(BaseModel):
    warning: float
    critical: float

class NotificationSettings(BaseModel):
    email: bool
    sms: bool

class Settings(BaseModel):
    thresholds: Dict[str, ThresholdSettings]
    notifications: NotificationSettings

class ChatMessage(BaseModel):
    message: str

class FailureType(str, Enum):
    HARDWARE = "hardware"
    SOFTWARE = "software"

class FailureSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Failure(BaseModel):
    id: str
    type: FailureType
    device_id: str
    component: str
    severity: FailureSeverity
    description: str
    timestamp: datetime
    status: str
    resolution_time: Optional[float] = None
    technician: Optional[str] = None
    resolution_notes: Optional[str] = None

class FailureStats(BaseModel):
    total_failures: int
    hardware_failures: int
    software_failures: int
    critical_failures: int
    warning_failures: int
    resolved_failures: int
    avg_resolution_time: float
    component_distribution: Dict[str, int]
    device_distribution: Dict[str, int]

class PredictionAnalysis(BaseModel):
    predicted_failure_date: str
    days_remaining: int
    causes: List[str]
    root_cause: str
    resource_requirements: Optional[Dict[str, int]] = None

class MaintenancePlan(BaseModel):
    steps: List[str]
    preventative_measures: List[str]
    estimated_time: int
    required_tools: List[str]
    skill_level: str

@app.get("/")
async def root():
    return {"message": "Predictive Maintenance API is running"}

@app.get("/device-status")
async def get_device_status():
    """Get current status of all devices"""
    try:
        # Update statuses before returning
        predictions = await get_predictions()
        for device_id in devices:
            status_info = update_device_status(device_id, alerts, predictions)
            devices[device_id]["status"] = status_info["status"]
            devices[device_id]["status_message"] = status_info["message"]
        return devices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Function to simulate sensor data update
def update_sensor_data_periodically():
    for device_id in devices.keys():
        # Simulate new sensor data
        new_data = generate_sensor_history()[device_id]
        
        # Append new data to existing sensor history without altering previous data
        existing_timestamps = {reading['raw_timestamp'] for reading in sensor_history[device_id]}
        new_data = [reading for reading in new_data if reading['raw_timestamp'] not in existing_timestamps]
        sensor_history[device_id].extend(new_data)
        
        # Sort by timestamp to ensure proper ordering
        sensor_history[device_id].sort(key=lambda x: x['raw_timestamp'])

def get_status_message(status, device_id, alerts, predictions):
    """Get detailed message for device status"""
    try:
        device_alerts = [a for a in alerts if a["device_id"] == device_id]
        device_predictions = [p for p in predictions if p["device_id"] == device_id]
        
        if status == "critical":
            critical_alerts = [a for a in device_alerts if a["severity"] >= 7 and not a.get("resolved", False)]
            if critical_alerts:
                return f"Critical alert(s) detected: {', '.join(a['message'] for a in critical_alerts)}"
            return "Critical condition detected in device sensors"
            
        elif status == "warning":
            warning_alerts = [a for a in device_alerts if 4 <= a["severity"] < 7 and not a.get("resolved", False)]
            if warning_alerts:
                return f"Warning alert(s) detected: {', '.join(a['message'] for a in warning_alerts)}"
            return "High-risk prediction detected"
            
        elif status == "degraded":
            return "Device showing signs of degradation"
            
        elif status == "operational":
            return "Device operating normally"
            
        elif status == "maintenance required":
            return "Scheduled maintenance required"
            
        elif status == "under maintenance":
            return "Device currently under maintenance"
            
        elif status == "out of service":
            return "Device is out of service"
            
        elif status == "disconnected":
            return "Device is disconnected from the network"
            
        elif status == "standby":
            return "Device is in standby mode"
            
        elif status == "testing":
            return "Device is undergoing testing"
            
        elif status == "battery low":
            return "Device battery level is low"
            
        elif status == "temperature alert":
            return "Temperature threshold exceeded"
            
        elif status == "firmware update":
            return "Firmware update required"
            
        elif status == "calibration needed":
            return "Device requires calibration"
            
        else:
            return "Status unknown"
    except Exception as e:
        print(f"Error getting status message: {str(e)}")
        return "Unable to determine status message"

def update_device_status(device_id, alerts, predictions):
    """Update device status based on alerts only"""
    try:
        # Get all alerts for this device
        device_alerts = [a for a in alerts if a["device_id"] == device_id]
        
        # Check for critical alerts
        critical_alerts = [a for a in device_alerts if a["severity"] >= 7 and not a.get("resolved", False)]
        if critical_alerts:
            status = "critical"
            message = get_status_message(status, device_id, alerts, predictions)
            return {"status": status, "message": message}
            
        # Check for warning alerts
        warning_alerts = [a for a in device_alerts if 4 <= a["severity"] < 7 and not a.get("resolved", False)]
        if warning_alerts:
            status = "warning"
            message = get_status_message(status, device_id, alerts, predictions)
            return {"status": status, "message": message}
        
        # Default to operational if no alerts
        status = "operational"
        message = get_status_message(status, device_id, alerts, predictions)
        return {"status": status, "message": message}
    except Exception as e:
        print(f"Error updating device status: {str(e)}")
        return {"status": "unknown", "message": "Unable to determine status"}

# Schedule the periodic update every 30 seconds
@app.on_event("startup")
@repeat_every(seconds=30)
async def periodic_sensor_update_task() -> None:
    update_sensor_data_periodically()
    
    # Update device statuses
    predictions = await get_predictions()
    for device_id in devices:
        status_info = update_device_status(device_id, alerts, predictions)
        devices[device_id]["status"] = status_info["status"]
        devices[device_id]["status_message"] = status_info["message"]

@app.get("/sensor-data")
async def get_sensor_data():
    # Return the updated sensor history
    return sensor_history

@app.get("/devices")
async def get_devices():
    return list(devices.values())

@app.get("/devices/{device_id}")
async def get_device(device_id: str):
    if device_id not in devices:
        raise HTTPException(status_code=404, detail="Device not found")
    return devices[device_id]

@app.post("/devices")
async def create_device(device: Device):
    devices[device.id] = device.dict()
    return device

@app.get("/alerts")
async def get_alerts(
    severity: Optional[str] = None,
    device_id: Optional[str] = None,
    include_resolved: bool = True
):
    """Get all alerts with optional filtering"""
    try:
        filtered_alerts = alerts
        if severity:
            if severity.lower() == "critical":
                filtered_alerts = [a for a in alerts if a["severity"] >= 7]
            elif severity.lower() == "warning":
                filtered_alerts = [a for a in alerts if 4 <= a["severity"] < 7]
            elif severity.lower() == "info":
                filtered_alerts = [a for a in alerts if a["severity"] < 4]
        
        if device_id:
            filtered_alerts = [a for a in filtered_alerts if a["device_id"] == device_id]
        
        if not include_resolved:
            filtered_alerts = [a for a in filtered_alerts if not a.get("acknowledged", False)]
        
        # Format timestamps and ensure resolution information is included
        for alert in filtered_alerts:
            if alert.get("acknowledged", False):
                alert["resolved_at"] = alert.get("resolution_timestamp", "Unknown")
                if alert["resolved_at"] != "Unknown":
                    try:
                        ts = datetime.fromisoformat(alert["resolved_at"].replace('Z', '+00:00'))
                        alert["resolved_at"] = ts.strftime("%m/%d/%Y, %I:%M:%S %p")
                    except:
                        alert["resolved_at"] = "Unknown"
                alert["resolution_notes"] = alert.get("resolution_notes", "No notes provided")
            else:
                alert["resolved_at"] = "Not resolved"
                alert["resolution_notes"] = "Not resolved"
        
        return filtered_alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict", response_model=List[AlertResponse])
async def predict(request: PredictionRequest, background_tasks: BackgroundTasks):
    try:
        # Convert request data to DataFrames
        sensor_df = pd.DataFrame(request.sensor_data)
        log_df = pd.DataFrame(request.log_data)
        
        # Make predictions
        predictions = model.predict(sensor_df, log_df)
        
        # Generate alerts
        new_alerts = []
        for i, pred in enumerate(predictions):
            if pred > 0.7:  # Threshold for generating alerts
                alert = {
                    "id": str(uuid.uuid4()),
                    "timestamp": datetime.now().isoformat(),
                    "device_id": request.device_id,
                    "alert_type": "PREDICTIVE_MAINTENANCE",
                    "severity": int(pred * 10),  # Scale to 1-10
                    "message": f"High probability of device failure detected",
                    "details": {
                        "probability": float(pred),
                        "sensor_readings": sensor_df.iloc[i].to_dict(),
                        "recommended_action": "Schedule maintenance check"
                    },
                    "acknowledged": False
                }
                new_alerts.append(alert)
                alerts.append(alert)
        
        # Update device status
        if request.device_id in devices:
            devices[request.device_id]["last_check"] = datetime.now()
            if any(a["severity"] > 7 for a in new_alerts):
                devices[request.device_id]["status"] = "warning"
        
        # Send notifications in background
        background_tasks.add_task(send_notifications, new_alerts)
        
        return new_alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, data: dict):
    """Acknowledge an alert and save resolution notes"""
    try:
        for alert in alerts:
            if alert["id"] == alert_id:
                alert["acknowledged"] = True
                alert["resolved"] = True
                alert["resolution_notes"] = data.get("notes") or "No specific resolution notes provided"
                alert["resolution_timestamp"] = data.get("resolution_timestamp") or datetime.now().isoformat()
                alert["resolved_by"] = data.get("resolved_by", "System")
                return {
                    "message": "Alert acknowledged and resolved",
                    "alert": alert
                }
        raise HTTPException(status_code=404, detail="Alert not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/alerts/{alert_id}/notes")
async def get_alert_notes(alert_id: str):
    """Get resolution notes for an alert"""
    try:
        alert = next((a for a in alerts if a["id"] == alert_id), None)
        if alert:
            return {
                "notes": alert.get("resolution_notes", ""),
                "resolution_timestamp": alert.get("resolution_timestamp", None)
            }
        raise HTTPException(status_code=404, detail="Alert not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/settings")
async def get_settings():
    return settings

@app.post("/settings")
async def update_settings(new_settings: Settings):
    settings.update(new_settings.dict())
    return settings

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model.model is not None,
        "timestamp": datetime.now().isoformat(),
        "device_count": len(devices),
        "alert_count": len(alerts)
    }

def send_notifications(alerts: List[dict]):
    """
    Mock function to send notifications.
    In production, implement actual email/SMS sending logic.
    """
    if settings["notifications"]["email"]:
        for alert in alerts:
            print(f"Sending email notification for alert {alert['id']}")
    
    if settings["notifications"]["sms"]:
        for alert in alerts:
            print(f"Sending SMS notification for alert {alert['id']}")

@app.post("/ai-chat")
async def chat_with_ai(message: ChatMessage):
    try:
        # Mock AI responses based on keywords
        response = get_mock_ai_response(message.message.lower())
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_mock_ai_response(message: str) -> str:
    # Simple keyword-based response system
    if "temperature" in message:
        return "High temperatures can indicate cooling system issues or overload. I recommend:\n1. Check cooling fans\n2. Verify airflow isn't blocked\n3. Monitor server load\n4. Ensure HVAC is functioning properly"
    
    elif "humidity" in message:
        return "Abnormal humidity levels can damage equipment. Here's what to check:\n1. Check for water leaks\n2. Verify HVAC dehumidification\n3. Monitor condensation\n4. Consider adding humidity sensors"
    
    elif "vibration" in message:
        return "Excessive vibration often indicates mechanical issues:\n1. Check for loose components\n2. Inspect fan bearings\n3. Verify equipment mounting\n4. Consider preventive maintenance"
    
    elif "maintenance" in message:
        return "For maintenance best practices:\n1. Schedule regular inspections\n2. Keep detailed maintenance logs\n3. Monitor performance metrics\n4. Follow manufacturer guidelines\n5. Train staff on procedures"
    
    elif "alert" in message:
        return "To manage alerts effectively:\n1. Set appropriate thresholds\n2. Prioritize critical alerts\n3. Document response procedures\n4. Maintain escalation protocols\n5. Review alert history regularly"
    
    elif "help" in message:
        return "I can help you with:\n- Temperature issues\n- Humidity concerns\n- Vibration problems\n- Maintenance procedures\n- Alert management\n- Best practices\n\nJust ask about any of these topics!"
    
    else:
        return "I'm here to help with maintenance and monitoring. You can ask about:\n- Device issues (temperature, humidity, vibration)\n- Maintenance procedures\n- Alert management\n- Best practices\n\nWhat would you like to know?"

@app.get("/failures")
async def get_failures(type: Optional[str] = None):
    if failures is None:  # Safeguard against None
        return []
    if type:
        return [f for f in failures if f["type"] == type]
    return failures

@app.get("/failure-stats")
async def get_failure_stats():
    if failures is None:  # Safeguard against None
        return {
            "total_failures": 0,
            "hardware_failures": 0,
            "software_failures": 0,
            "critical_failures": 0,
            "warning_failures": 0,
            "resolved_failures": 0,
            "avg_resolution_time": 0,
            "component_distribution": {}
        }
        
    total = len(failures)
    hardware = len([f for f in failures if f["type"] == "hardware"])
    software = len([f for f in failures if f["type"] == "software"])
    critical = len([f for f in failures if f["severity"] == "critical"])
    warning = len([f for f in failures if f["severity"] in ["high", "medium"]])
    resolved = len([f for f in failures if f["status"] == "resolved"])
    
    # Calculate average resolution time for resolved failures
    resolution_times = [f["resolution_time"] for f in failures if f["resolution_time"] is not None]
    avg_resolution_time = sum(resolution_times) / len(resolution_times) if resolution_times else 0
    
    # Calculate component distribution
    component_dist = {}
    for f in failures:
        component = f["component"]
        component_dist[component] = component_dist.get(component, 0) + 1
    
    return {
        "total_failures": total,
        "hardware_failures": hardware,
        "software_failures": software,
        "critical_failures": critical,
        "warning_failures": warning,
        "resolved_failures": resolved,
        "avg_resolution_time": avg_resolution_time,
        "component_distribution": component_dist
    }

@app.get("/failure-timeline")
async def get_failure_timeline():
    if failures is None:  # Safeguard against None
        return []
        
    # Group failures by date
    timeline = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        day_failures = [f for f in failures if f["timestamp"].startswith(date)]
        timeline.append({
            "date": date,
            "total": len(day_failures),
            "critical": len([f for f in day_failures if f["severity"] == "critical"])
        })
    return timeline

@app.get("/alert-trends")
async def get_alert_trends():
    # Group alerts by date and type
    trends = []
    for i in range(7):
        date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        day_alerts = [a for a in alerts if a["timestamp"].startswith(date)]
        
        trends.append({
            "date": date,
            "Critical Alerts": len([a for a in day_alerts if a["type"] == "critical"]),
            "Warning Alerts": len([a for a in day_alerts if a["type"] == "warning"]),
            "Info Alerts": 0  # We don't have info alerts in our system
        })
    return trends

@app.get("/maintenance-costs")
async def get_maintenance_costs():
    return {
        "preventive": 250,
        "corrective": 500,
        "total": 750
    }

@app.get("/device-status/{device_id}")
async def get_device_info(device_id: str):
    if device_id not in devices:
        raise HTTPException(status_code=404, detail="Device not found")
    return devices[device_id]

@app.get("/sensor-data/{device_id}")
async def get_device_sensor_data(device_id: str):
    if device_id not in devices:
        raise HTTPException(status_code=404, detail="Device not found")
    # Generate sensor history for the specific device
    device_sensor_data = generate_sensor_history(device_id=device_id)
    return device_sensor_data.get(device_id, [])

@app.get("/dashboard/kpis")
async def get_kpis():
    """Get high-level KPIs for the dashboard"""
    try:
        # Calculate KPIs from device data
        total_devices = len(devices)
        total_operational = sum(1 for d in devices.values() if d["status"] == "operational")
        total_warning = sum(1 for d in devices.values() if d["status"] == "warning")
        total_critical = sum(1 for d in devices.values() if d["status"] == "critical")
        
        # Calculate MTBF (Mean Time Between Failures)
        mtbf_values = [d.get("metrics", {}).get("mtbf", 0) for d in devices.values()]
        mtbf = sum(mtbf_values) / len(mtbf_values) if mtbf_values else 0
        
        # Calculate MTTR (Mean Time To Repair)
        mttr_values = [d.get("metrics", {}).get("mttr", 0) for d in devices.values()]
        mttr = sum(mttr_values) / len(mttr_values) if mttr_values else 0
        
        # Calculate OEE (Overall Equipment Effectiveness)
        oee_values = [d.get("metrics", {}).get("oee", 0) for d in devices.values()]
        oee = sum(oee_values) / len(oee_values) if oee_values else 0
        
        # Calculate predictive ratio
        total_failures = len(failures)
        total_predictive = sum(1 for f in failures if f.get("type") == "predictive")
        predictive_ratio = total_predictive / total_failures if total_failures > 0 else 0
        
        return {
            "mtbf": mtbf,
            "mttr": mttr,
            "oee": oee,
            "predictive_ratio": predictive_ratio,
            "device_stats": {
                "total": total_devices,
                "operational": total_operational,
                "warning": total_warning,
                "critical": total_critical
            }
        }
    except Exception as e:
        print(f"Error in get_kpis: {str(e)}")  # Add logging for debugging
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate KPIs. Please ensure all devices have required metrics."
        )

@app.get("/dashboard/predictions")
async def get_predictions():
    """Get list of predicted failures"""
    try:
        predictions = []
        for device_id, device_data in devices.items():
            # Only generate predictions for devices with sensor data
            if device_id in sensor_history and len(sensor_history[device_id]) > 0:
                recent_data = sensor_history[device_id][-10:]  # Get last 10 readings
                
                # Extract sensor values from the data
                sensor_values = []
                for reading in recent_data:
                    if isinstance(reading, dict):
                        # Create a clean sensor reading without timestamp
                        sensor_reading = {}
                        for key, value in reading.items():
                            if key not in ['timestamp', 'raw_timestamp']:
                                sensor_reading[key] = value
                        sensor_values.append(sensor_reading)
                    else:
                        # If no sensor data, use default values
                        sensor_values.append({
                            'temperature': random.uniform(20, 30),
                            'humidity': random.uniform(40, 60),
                            'vibration': random.uniform(0, 5)
                        })
                
                # Make prediction using the model
                try:
                    prediction = model.predict(pd.DataFrame(sensor_values), [])[0]
                except Exception as e:
                    print(f"Error making prediction for device {device_id}: {str(e)}")
                    prediction = random.uniform(0, 1)  # Fallback to random prediction
                
                # Calculate time to failure based on prediction
                time_to_failure = int((1 - prediction) * 30)  # Days until failure
                
                # Determine effects based on device type
                effects = []
                if device_data["type"].lower() == "hvac":
                    effects = ["Temperature regulation", "Humidity control", "Air quality"]
                elif device_data["type"].lower() == "power":
                    effects = ["Power supply", "Voltage stability", "Current regulation"]
                elif device_data["type"].lower() == "network":
                    effects = ["Network connectivity", "Data transfer", "Communication"]
                elif device_data["type"].lower() == "storage":
                    effects = ["Data access", "Storage capacity", "Read/write operations"]
                
                # Create prediction with proper timestamp handling
                current_time = datetime.now()
                prediction_time = current_time.isoformat()
                failure_time = (current_time + timedelta(days=time_to_failure)).isoformat()
                
                predictions.append({
                    "id": str(uuid.uuid4()),
                    "device_id": device_id,
                    "device_name": device_data["name"],
                    "prediction_time": prediction_time,
                    "failure_time": failure_time,
                    "location": device_data["location"],
                    "severity": prediction,
                    "risk_score": prediction * 100,
                    "component": device_data["type"],
                    "confidence": random.uniform(0.7, 0.95),
                    "effects": effects,
                    "time_since_prediction": 0  # Will be calculated on the frontend
                })
        
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/environmental")
async def get_environmental_alerts():
    """Get environmental and unexpected issues"""
    try:
        alerts = []
        
        # Check for weather-related issues
        if random.random() < 0.3:  # 30% chance of weather alert
            alerts.append({
                "id": str(uuid.uuid4()),
                "type": "weather",
                "severity": random.choice(["low", "medium", "high", "critical"]),
                "start_time": datetime.now().isoformat(),
                "end_time": (datetime.now() + timedelta(hours=2)).isoformat(),
                "impact": ["Temperature", "Humidity", "Air pressure"],
                "description": "Weather conditions may affect equipment performance",
                "affected_devices": random.sample(list(devices.keys()), min(3, len(devices)))
            })
        
        # Check for power-related issues
        if random.random() < 0.2:  # 20% chance of power alert
            alerts.append({
                "id": str(uuid.uuid4()),
                "type": "power",
                "severity": random.choice(["low", "medium", "high", "critical"]),
                "start_time": datetime.now().isoformat(),
                "end_time": (datetime.now() + timedelta(hours=1)).isoformat(),
                "impact": ["Power supply", "Voltage stability"],
                "description": "Power fluctuations detected",
                "affected_devices": random.sample(list(devices.keys()), min(2, len(devices)))
            })
        
        # Check for sensor issues
        for device_id, device_data in devices.items():
            if device_id in sensor_history and len(sensor_history[device_id]) > 0:
                recent_data = sensor_history[device_id][-5:]  # Check last 5 readings
                if any(reading.get("sensor_error", False) for reading in recent_data):
                    alerts.append({
                        "id": str(uuid.uuid4()),
                        "type": "sensor",
                        "severity": "high",
                        "start_time": datetime.now().isoformat(),
                        "end_time": None,  # Will be set when resolved
                        "impact": ["Data collection", "Monitoring"],
                        "description": f"Sensor issues detected for {device_data['name']}",
                        "affected_devices": [device_id]
                    })
        
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/sensor-health")
async def get_sensor_health():
    """Get sensor health status and calibration information"""
    try:
        sensors = []
        for device_id, device_data in devices.items():
            if device_id in sensor_history:
                # Get sensor types from the device data
                sensor_types = list(device_data.get("sensors", {}).keys())
                
                for sensor_type in sensor_types:
                    # Generate mock calibration dates
                    last_calibration = datetime.now() - timedelta(days=random.randint(1, 90))
                    next_calibration = last_calibration + timedelta(days=90)
                    
                    # Check for data gaps
                    data_gaps = []
                    if random.random() < 0.3:  # 30% chance of having data gaps
                        num_gaps = random.randint(1, 3)
                        for _ in range(num_gaps):
                            start = datetime.now() - timedelta(hours=random.randint(1, 24))
                            end = start + timedelta(minutes=random.randint(5, 60))
                            data_gaps.append({
                                "start": start.isoformat(),
                                "end": end.isoformat()
                            })
                    
                    # Determine sensor status
                    status = "healthy"
                    if len(data_gaps) > 0:
                        status = "warning"
                    if random.random() < 0.1:  # 10% chance of critical status
                        status = "critical"
                    
                    sensors.append({
                        "device_id": device_id,
                        "sensor_type": sensor_type,
                        "status": status,
                        "last_calibration": last_calibration.isoformat(),
                        "next_calibration": next_calibration.isoformat(),
                        "data_gaps": data_gaps
                    })
        
        return sensors
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dashboard/export")
async def export_data(
    device: Optional[str] = None,
    location: Optional[str] = None,
    severity: Optional[str] = None,
    date_range: Optional[str] = None
):
    """Export filtered dashboard data"""
    try:
        # Get all relevant data
        kpis = await get_kpis()
        predictions = await get_predictions()
        environmental = await get_environmental_alerts()
        sensor_health = await get_sensor_health()
        
        # Apply filters
        if device and device != "all":
            predictions = [p for p in predictions if p["device_id"] == device]
            environmental = [e for e in environmental if device in e["affected_devices"]]
            sensor_health = [s for s in sensor_health if s["device_id"] == device]
        
        if location and location != "all":
            predictions = [p for p in predictions if p["location"] == location]
            devices_in_location = [d for d in devices.values() if d["location"] == location]
            device_ids = [d["id"] for d in devices_in_location]
            environmental = [e for e in environmental if any(d in e["affected_devices"] for d in device_ids)]
            sensor_health = [s for s in sensor_health if s["device_id"] in device_ids]
        
        if severity and severity != "all":
            predictions = [p for p in predictions if p["severity"] == severity]
            environmental = [e for e in environmental if e["severity"] == severity]
        
        if date_range:
            days = int(date_range[:-1])  # Remove 'd' from '7d'
            cutoff_date = datetime.now() - timedelta(days=days)
            predictions = [p for p in predictions if parse(p["prediction_time"]) >= cutoff_date]
            environmental = [e for e in environmental if parse(e["start_time"]) >= cutoff_date]
        
        # Prepare CSV data
        csv_data = []
        
        # Add KPIs
        csv_data.append(["KPIs"])
        csv_data.append(["Metric", "Value"])
        csv_data.append(["MTBF (hrs)", kpis["mtbf"]])
        csv_data.append(["MTTR (hrs)", kpis["mttr"]])
        csv_data.append(["OEE (%)", kpis["oee"] * 100])
        csv_data.append(["Predictive Ratio (%)", kpis["predictive_ratio"] * 100])
        csv_data.append([])
        
        # Add predictions
        csv_data.append(["Predicted Failures"])
        csv_data.append(["Device", "Prediction Time", "Failure Time", "Location", "Severity", "Risk Score", "Effects"])
        for p in predictions:
            csv_data.append([
                p["device_name"],
                p["prediction_time"],
                p["failure_time"],
                p["location"],
                p["severity"],
                p["risk_score"],
                ", ".join(p["effects"])
            ])
        csv_data.append([])
        
        # Add environmental alerts
        csv_data.append(["Environmental Alerts"])
        csv_data.append(["Type", "Severity", "Start Time", "End Time", "Description", "Affected Devices"])
        for e in environmental:
            csv_data.append([
                e["type"],
                e["severity"],
                e["start_time"],
                e["end_time"] or "Ongoing",
                e["description"],
                ", ".join(e["affected_devices"])
            ])
        csv_data.append([])
        
        # Add sensor health
        csv_data.append(["Sensor Health"])
        csv_data.append(["Device", "Sensor Type", "Status", "Last Calibration", "Next Calibration", "Data Gaps"])
        for s in sensor_health:
            csv_data.append([
                devices[s["device_id"]]["name"],
                s["sensor_type"],
                s["status"],
                s["last_calibration"],
                s["next_calibration"],
                len(s["data_gaps"])
            ])
        
        # Convert to CSV string
        csv_string = "\n".join([",".join(map(str, row)) for row in csv_data])
        
        return Response(
            content=csv_string,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=dashboard_export.csv"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/maintenance-recommendations")
async def get_maintenance_recommendations():
    """Get maintenance recommendations for devices"""
    try:
        recommendations = []
        for device_id, device_data in devices.items():
            # Generate recommendations based on device type and status
            if device_data["status"] in ["warning", "critical"]:
                # Get recent sensor data
                recent_data = sensor_history.get(device_id, [])[-5:]
                
                # Generate maintenance action based on device type and sensor data
                action = ""
                priority = ""
                resources = []
                estimated_duration = 0
                
                if device_data["type"].lower() == "hvac":
                    if any(r.get("temperature", 0) > 75 for r in recent_data):
                        action = "Check and clean cooling system components"
                        priority = "high"
                        resources = ["HVAC technician", "Cleaning supplies", "Replacement filters"]
                        estimated_duration = 2
                elif device_data["type"].lower() == "power":
                    if any(r.get("voltage", 0) > 240 for r in recent_data):
                        action = "Inspect power supply unit and connections"
                        priority = "critical"
                        resources = ["Electrician", "Voltage meter", "Spare parts"]
                        estimated_duration = 3
                elif device_data["type"].lower() == "network":
                    if any(r.get("packet_loss", 0) > 5 for r in recent_data):
                        action = "Check network interfaces and cables"
                        priority = "medium"
                        resources = ["Network technician", "Cable tester", "Spare cables"]
                        estimated_duration = 1
                elif device_data["type"].lower() == "storage":
                    if any(r.get("disk_usage", 0) > 90 for r in recent_data):
                        action = "Perform disk cleanup and health check"
                        priority = "high"
                        resources = ["System admin", "Disk diagnostic tools"]
                        estimated_duration = 4
                
                if action:  # Only add if we have a specific recommendation
                    recommendations.append({
                        "id": str(uuid.uuid4()),
                        "device_id": device_id,
                        "device_name": device_data["name"],
                        "action": action,
                        "priority": priority,
                        "estimated_duration": estimated_duration,
                        "required_resources": resources,
                        "status": "pending",
                        "created_at": datetime.now().isoformat()
                    })
        
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard/root-causes")
async def get_root_causes():
    """Get root cause analysis data"""
    try:
        # Analyze failures and generate root cause data
        root_causes = [
            {
                "id": str(uuid.uuid4()),
                "cause": "Wear and Tear",
                "count": random.randint(5, 15),
                "severity": "medium",
                "affected_components": ["Cooling Fan", "Power Supply", "Storage Disk"],
                "prevention_steps": [
                    "Regular maintenance checks",
                    "Component replacement schedule",
                    "Usage monitoring"
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "cause": "Environmental Stress",
                "count": random.randint(3, 8),
                "severity": "high",
                "affected_components": ["Temperature Sensors", "Humidity Sensors"],
                "prevention_steps": [
                    "Improve cooling system",
                    "Regular environment monitoring",
                    "Install protective measures"
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "cause": "Operational Overload",
                "count": random.randint(4, 10),
                "severity": "critical",
                "affected_components": ["CPU", "Memory", "Network Card"],
                "prevention_steps": [
                    "Load balancing",
                    "Capacity planning",
                    "Performance monitoring"
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "cause": "Power Issues",
                "count": random.randint(2, 6),
                "severity": "high",
                "affected_components": ["Power Supply", "Voltage Regulator"],
                "prevention_steps": [
                    "UPS installation",
                    "Power quality monitoring",
                    "Electrical system maintenance"
                ]
            },
            {
                "id": str(uuid.uuid4()),
                "cause": "Software Configuration",
                "count": random.randint(3, 7),
                "severity": "medium",
                "affected_components": ["Operating System", "Device Drivers"],
                "prevention_steps": [
                    "Regular updates",
                    "Configuration backups",
                    "Change management"
                ]
            }
        ]
        
        return root_causes
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/predictions/analysis/{alert_id}")
async def get_prediction_analysis(alert_id: str):
    """Get detailed analysis for a specific alert"""
    try:
        # Find the alert
        alert = next((a for a in alerts if a["id"] == alert_id), None)
        if not alert:
            # Return default analysis data if alert not found
            return PredictionAnalysis(
                predicted_failure_date=(datetime.now() + timedelta(days=3)).isoformat(),
                days_remaining=3,
                causes=["System analysis pending"],
                root_cause="Analysis in progress",
                resource_requirements={"maintenance_technician": 1}
            )

        # Get device data
        device = devices.get(alert["device_id"])
        if not device:
            device = {"type": "unknown", "name": "Unknown Device", "location": "Unknown"}

        # Calculate predicted failure date based on severity
        severity = alert.get("severity", 5)
        if isinstance(severity, str):
            severity_map = {"critical": 9, "high": 7, "medium": 5, "low": 3}
            severity = severity_map.get(severity.lower(), 5)
        
        days_to_add = max(1, (10 - severity))
        predicted_date = datetime.now() + timedelta(days=days_to_add)
        
        # Calculate days remaining based on severity-weighted SLA
        severity_weight = {
            "critical": 1,
            "high": 2,
            "medium": 3,
            "low": 5
        }
        days_remaining = severity_weight.get(alert["type"].lower(), 3)

        # Get causes using LSTM model
        try:
            causes = model.analyze_causes(alert)
        except Exception as e:
            print(f"Error analyzing causes: {str(e)}")
            causes = ["System performance degradation", "Regular maintenance required"]
        
        # Get root cause
        try:
            root_cause = model.predict_root_cause(alert)
        except Exception as e:
            print(f"Error predicting root cause: {str(e)}")
            root_cause = "System performance deviation"
        
        # Get resource requirements
        try:
            resource_reqs = model.predict_resource_requirements(alert, device)
        except Exception as e:
            print(f"Error predicting resource requirements: {str(e)}")
            resource_reqs = {"maintenance_technician": 1}

        return PredictionAnalysis(
            predicted_failure_date=predicted_date.isoformat(),
            days_remaining=days_remaining,
            causes=causes,
            root_cause=root_cause,
            resource_requirements=resource_reqs
        )
    except Exception as e:
        print(f"Error in get_prediction_analysis: {str(e)}")
        # Return default analysis data in case of error
        return PredictionAnalysis(
            predicted_failure_date=(datetime.now() + timedelta(days=3)).isoformat(),
            days_remaining=3,
            causes=["System analysis pending"],
            root_cause="Analysis in progress",
            resource_requirements={"maintenance_technician": 1}
        )

@app.post("/predictions/move-to-maintenance/{alert_id}")
async def move_to_maintenance(alert_id: str):
    """Move an alert to maintenance tab"""
    try:
        alert = next((a for a in alerts if a["id"] == alert_id), None)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        # Update alert status to indicate it's moved to maintenance
        alert["moved_to_maintenance"] = True
        alert["maintenance_timestamp"] = datetime.now().isoformat()
        
        return {"message": "Alert moved to maintenance successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/maintenance/plan/{alert_id}")
async def get_maintenance_plan(alert_id: str):
    """Get maintenance plan for an alert"""
    try:
        # Find the alert
        alert = next((a for a in alerts if a["id"] == alert_id), None)
        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Get device data
        device = devices.get(alert["device_id"])
        if not device:
            device = {"type": "unknown", "name": "Unknown Device"}

        # Get prediction analysis
        try:
            analysis = await get_prediction_analysis(alert_id)
        except Exception as e:
            print(f"Error getting prediction analysis: {str(e)}")
            # Create a default analysis object if prediction fails
            analysis = PredictionAnalysis(
                predicted_failure_date=(datetime.now() + timedelta(days=3)).isoformat(),
                days_remaining=3,
                causes=["System performance degradation", "Regular maintenance required"],
                root_cause="System performance deviation",
                resource_requirements={"maintenance_technician": 1}
            )

        # Generate base maintenance plan
        maintenance_plan = {
            "steps": [],
            "preventative_measures": [],
            "estimated_time": 0,
            "required_tools": [],
            "skill_level": "Basic"
        }

        # Add steps based on alert type and severity
        if "temperature" in alert.get("message", "").lower():
            maintenance_plan["steps"].extend([
                "Monitor temperature readings for 24 hours",
                "Check for airflow obstructions",
                "Verify cooling system operation"
            ])
            maintenance_plan["preventative_measures"].extend([
                "Regular temperature monitoring",
                "Scheduled cooling system maintenance",
                "Airflow optimization"
            ])
        elif "network" in alert.get("message", "").lower():
            maintenance_plan["steps"].extend([
                "Run network diagnostics",
                "Check network cable connections",
                "Verify network configuration"
            ])
            maintenance_plan["preventative_measures"].extend([
                "Regular network performance monitoring",
                "Scheduled network maintenance",
                "Backup network configuration"
            ])
        elif "power" in alert.get("message", "").lower():
            maintenance_plan["steps"].extend([
                "Check power supply connections",
                "Measure voltage levels",
                "Inspect circuit breakers"
            ])
            maintenance_plan["preventative_measures"].extend([
                "Regular power quality monitoring",
                "UPS maintenance",
                "Power system redundancy check"
            ])
        else:
            maintenance_plan["steps"].extend([
                "1. Perform initial system diagnosis",
                "2. Check system logs for errors",
                "3. Test component functionality",
                "4. Perform necessary repairs or replacements",
                "5. Verify system operation"
            ])
            maintenance_plan["preventative_measures"].extend([
                "Regular system monitoring",
                "Scheduled maintenance checks",
                "Component health tracking",
                "Performance optimization"
            ])

        # Add estimated completion time based on severity
        severity = alert.get("severity", 5)
        if isinstance(severity, str):
            severity_map = {"critical": 9, "high": 7, "medium": 5, "low": 3}
            severity = severity_map.get(severity.lower(), 5)
        maintenance_plan["estimated_time"] = max(1, severity * 0.5)  # hours

        # Add required tools based on device type
        if device["type"].lower() == "hvac":
            maintenance_plan["required_tools"].extend([
                "Temperature sensors",
                "Airflow meters",
                "HVAC diagnostic tools"
            ])
        elif device["type"].lower() == "network":
            maintenance_plan["required_tools"].extend([
                "Network analyzer",
                "Cable tester",
                "Diagnostic software"
            ])
        elif device["type"].lower() == "power":
            maintenance_plan["required_tools"].extend([
                "Multimeter",
                "Power quality analyzer",
                "Safety equipment"
            ])
        else:
            maintenance_plan["required_tools"].extend([
                "Basic diagnostic tools",
                "Maintenance toolkit",
                "Safety equipment"
            ])

        # Set skill level based on severity
        if severity >= 7:
            maintenance_plan["skill_level"] = "Expert"
        elif severity >= 4:
            maintenance_plan["skill_level"] = "Intermediate"
        else:
            maintenance_plan["skill_level"] = "Basic"
        
        return maintenance_plan
    except Exception as e:
        print(f"Error in get_maintenance_plan: {str(e)}")
        # Return a basic maintenance plan instead of throwing an error
        return {
            "steps": ["1. Perform system diagnosis", "2. Contact maintenance team"],
            "preventative_measures": ["Regular system checks"],
            "estimated_time": 1,
            "required_tools": ["Basic toolkit"],
            "skill_level": "Basic"
        }

@app.get("/dashboard/statistics")
async def get_dashboard_statistics():
    """Get dashboard statistics"""
    try:
        # Calculate statistics
        total_alerts = len(alerts)
        critical_alerts = len([a for a in alerts if a["severity"] >= 7 and not a.get("acknowledged", False)])
        warning_alerts = len([a for a in alerts if 4 <= a["severity"] < 7 and not a.get("acknowledged", False)])
        info_alerts = len([a for a in alerts if a["severity"] < 4 and not a.get("acknowledged", False)])
        resolved_alerts = len([a for a in alerts if a.get("acknowledged", False)])
        
        # Calculate device statistics
        total_devices = len(devices)
        operational_devices = len([d for d in devices.values() if d["status"] == "operational"])
        warning_devices = len([d for d in devices.values() if d["status"] == "warning"])
        critical_devices = len([d for d in devices.values() if d["status"] == "critical"])
        
        return {
            "alerts": {
                "total": total_alerts,
                "critical": critical_alerts,
                "warning": warning_alerts,
                "info": info_alerts,
                "resolved": resolved_alerts
            },
            "devices": {
                "total": total_devices,
                "operational": operational_devices,
                "warning": warning_devices,
                "critical": critical_devices
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
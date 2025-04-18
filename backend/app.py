from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Optional, Dict
# from ml_model import PredictiveMaintenanceModel
import json
import os
import uuid
import random
from enum import Enum

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
# model = PredictiveMaintenanceModel()
# model.load_model()

# In-memory storage (replace with database in production)
devices = {}
alerts = []
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

# Store historical sensor data
sensor_history = {}

def generate_sensor_history():
    for device_id, device in devices.items():
        if device_id not in sensor_history:
            sensor_history[device_id] = []
        
        # Generate last 10 readings with small variations
        base_temp = device["sensors"]["temperature"]
        base_humidity = device["sensors"]["humidity"]
        base_vibration = device["sensors"]["vibration"]
        
        for i in range(10):
            reading = {
                "temperature": round(base_temp + random.uniform(-2, 2), 1),
                "humidity": round(base_humidity + random.uniform(-5, 5)),
                "vibration": round(base_vibration + random.uniform(-0.3, 0.3), 2),
                "timestamp": (datetime.now() - timedelta(minutes=i*5)).isoformat()
            }
            sensor_history[device_id].append(reading)

# Initialize mock data
def init_mock_data():
    # Add mock devices for banking infrastructure
    mock_devices = [
        {
            "id": "atm_001",
            "name": "ATM - Main Branch",
            "location": "Main Branch, Downtown",
            "type": "ATM",
            "status": "healthy",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 35.5,
                "humidity": 45.0,
                "vibration": 1.5
            }
        },
        {
            "id": "server_001",
            "name": "Core Banking Server",
            "location": "Data Center 1",
            "type": "Server",
            "status": "healthy",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 42.0,
                "humidity": 50.0,
                "vibration": 0.8
            }
        },
        {
            "id": "ups_001",
            "name": "UPS System - Main",
            "location": "Data Center 1",
            "type": "Power System",
            "status": "warning",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 68.0,
                "humidity": 65.0,
                "vibration": 4.2
            }
        },
        {
            "id": "ac_001",
            "name": "HVAC Unit 1",
            "location": "Server Room A",
            "type": "Climate Control",
            "status": "healthy",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 22.0,
                "humidity": 55.0,
                "vibration": 2.1
            }
        },
        {
            "id": "network_001",
            "name": "Core Network Switch",
            "location": "Network Operations Center",
            "type": "Network",
            "status": "healthy",
            "last_check": datetime.now(),
            "sensors": {
                "temperature": 45.5,
                "humidity": 48.0,
                "vibration": 0.5
            }
        }
    ]
    
    for device in mock_devices:
        devices[device["id"]] = device
    
    # Add mock alerts
    mock_alerts = [
        {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "device_id": "ups_001",
            "alert_type": "HIGH_TEMPERATURE",
            "severity": 7,
            "message": "UPS temperature approaching critical threshold",
            "details": {
                "temperature": 68.0,
                "threshold": 65.0
            },
            "acknowledged": False
        },
        {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "device_id": "server_001",
            "alert_type": "PERFORMANCE_WARNING",
            "severity": 4,
            "message": "Server performance metrics showing unusual patterns",
            "details": {
                "load": 85.5,
                "threshold": 80.0
            },
            "acknowledged": False
        }
    ]
    
    alerts.extend(mock_alerts)

# Initialize mock data on startup
init_mock_data()

# Generate initial sensor history
generate_sensor_history()

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

# Mock failures data
failures = []

def generate_mock_failures():
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
    
    for _ in range(10):
        failure = {
            "id": str(uuid.uuid4()),
            "type": random.choice(["hardware", "software"]),
            "device_id": random.choice(list(devices.keys())),
            "component": random.choice(components),
            "severity": random.choice(["low", "medium", "high", "critical"]),
            "description": random.choice(descriptions),
            "timestamp": (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat(),
            "status": random.choice(["open", "in_progress", "resolved"]),
            "resolution_time": random.uniform(1, 24) if random.random() > 0.3 else None,
            "technician": random.choice(technicians),
            "resolution_notes": "Issue resolved by replacing component" if random.random() > 0.5 else None
        }
        failures.append(failure)

# Generate initial mock failures
generate_mock_failures()

@app.get("/")
async def root():
    return {"message": "Predictive Maintenance API is running"}

@app.get("/device-status")
async def get_device_status():
    return devices

@app.get("/sensor-data")
async def get_sensor_data():
    # Update sensor history before returning
    generate_sensor_history()
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
async def get_alerts(severity: Optional[str] = None, device_id: Optional[str] = None):
    filtered_alerts = alerts
    if severity:
        if severity == "high":
            filtered_alerts = [a for a in alerts if a["severity"] > 7]
        elif severity == "medium":
            filtered_alerts = [a for a in alerts if 4 < a["severity"] <= 7]
        elif severity == "low":
            filtered_alerts = [a for a in alerts if a["severity"] <= 4]
    if device_id:
        filtered_alerts = [a for a in filtered_alerts if a["device_id"] == device_id]
    return filtered_alerts

@app.post("/predict", response_model=List[AlertResponse])
async def predict(request: PredictionRequest, background_tasks: BackgroundTasks):
    try:
        # Convert request data to DataFrames
        sensor_df = pd.DataFrame(request.sensor_data)
        log_df = pd.DataFrame(request.log_data)
        
        # Make predictions
        # predictions = model.predict(sensor_df, log_df)
        
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
async def acknowledge_alert(alert_id: str):
    for alert in alerts:
        if alert["id"] == alert_id:
            alert["acknowledged"] = True
            return {"message": "Alert acknowledged"}
    raise HTTPException(status_code=404, detail="Alert not found")

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
    filtered_failures = failures
    if type:
        filtered_failures = [f for f in failures if f["type"] == type]
    return filtered_failures

@app.get("/failure-stats")
async def get_failure_stats():
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
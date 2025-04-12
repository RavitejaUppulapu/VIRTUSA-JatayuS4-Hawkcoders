from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from ml_model import PredictiveMaintenanceModel
import json
import os
import uuid
import random

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

@app.get("/")
async def root():
    return {"message": "Predictive Maintenance API is running"}

@app.get("/device-status")
async def get_device_status():
    return devices

@app.get("/sensor-data")
async def get_sensor_data():
    sensor_data = []
    for device_id, device in devices.items():
        data = {
            "device_id": device_id,
            "timestamp": datetime.now().isoformat(),
            **device["sensors"]
        }
        sensor_data.append(data)
    return sensor_data

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
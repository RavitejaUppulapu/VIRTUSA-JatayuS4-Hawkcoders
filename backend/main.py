from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import pandas as pd
import numpy as np
from datetime import datetime
import json
import os

# Data paths configuration
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
RAW_DATA_DIR = os.path.join(DATA_DIR, 'raw')
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, 'processed')
MODELS_DIR = os.path.join(DATA_DIR, 'models')

# Create directories if they don't exist
os.makedirs(RAW_DATA_DIR, exist_ok=True)
os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

app = FastAPI(title="Predictive Maintenance System")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class SensorData(BaseModel):
    timestamp: str
    device_id: str
    component_type: str
    sensor_type: str
    sensor_value: float
    threshold_breach: bool
    location: str

class LogData(BaseModel):
    timestamp: str
    device_id: str
    component_type: str
    log_type: str
    log_message: str
    event_severity: int
    error_code: Optional[str] = None
    performance_metrics: Optional[str] = None

class Alert(BaseModel):
    timestamp: str
    device_id: str
    alert_type: str
    severity: int
    message: str
    details: dict

# In-memory storage (replace with database in production)
sensor_data = []
log_data = []
alerts = []

@app.get("/")
async def root():
    return {"message": "Predictive Maintenance System API"}

@app.post("/sensor-data/")
async def add_sensor_data(data: SensorData):
    sensor_data.append(data.dict())
    # Save to file
    df = pd.DataFrame(sensor_data)
    df.to_csv(os.path.join(RAW_DATA_DIR, 'sensor_data.csv'), index=False)
    return {"message": "Sensor data added successfully"}

@app.post("/log-data/")
async def add_log_data(data: LogData):
    log_data.append(data.dict())
    # Save to file
    df = pd.DataFrame(log_data)
    df.to_csv(os.path.join(RAW_DATA_DIR, 'log_data.csv'), index=False)
    return {"message": "Log data added successfully"}

@app.get("/alerts/")
async def get_alerts():
    return alerts

@app.get("/device-status/{device_id}")
async def get_device_status(device_id: str):
    device_sensors = [s for s in sensor_data if s["device_id"] == device_id]
    device_logs = [l for l in log_data if l["device_id"] == device_id]
    
    if not device_sensors and not device_logs:
        raise HTTPException(status_code=404, detail="Device not found")
    
    return {
        "device_id": device_id,
        "sensor_data": device_sensors,
        "log_data": device_logs
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
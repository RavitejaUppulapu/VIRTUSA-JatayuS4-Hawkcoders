import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI
from app import app, init_mock_data, Device, PredictionRequest, Settings, ChatMessage, FailureType, FailureSeverity
from app import ThresholdSettings, NotificationSettings
from datetime import datetime, timedelta
import json
import os
from unittest.mock import patch
import pandas as pd



# Initialize the test client
client = TestClient(app)

# Fixture to reset mock data before each test
@pytest.fixture(autouse=True)
def reset_mock_data():
    init_mock_data()
    yield

# Test the root endpoint
def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Predictive Maintenance API is running"}

# Test getting device statuses
def test_get_device_status():
    response = client.get("/device-status")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test getting sensor data
def test_get_sensor_data():
    response = client.get("/sensor-data")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test getting all devices
def test_get_devices():
    response = client.get("/devices")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting a device by ID (success)
def test_get_device_success():
    response = client.get("/devices/device_1")
    assert response.status_code == 200
    assert response.json()["id"] == "device_1"

# Test getting a device by ID (failure)
def test_get_device_failure():
    response = client.get("/devices/nonexistent_device")
    assert response.status_code == 404
    assert response.json()["detail"] == "Device not found"

# Test creating a device
def test_create_device():
    new_device = {
        "id": "test_device",
        "name": "Test Device",
        "location": "Test Location",
        "type": "Test Type",
        "status": "operational",
        "last_check": datetime.now().isoformat(),
        "sensors": {"temperature": 25.0, "humidity": 50.0}
    }
    response = client.post("/devices", json=new_device)
    assert response.status_code == 200
    assert response.json()["id"] == "test_device"

# Test getting alerts (no filters)
def test_get_alerts_no_filters():
    response = client.get("/alerts")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting alerts (severity filter)
def test_get_alerts_severity_filter():
    response = client.get("/alerts?severity=critical")
    assert response.status_code == 200
    alerts = response.json()
    if alerts:  # Check if any alerts were returned
        for alert in alerts:
            assert alert["severity"] >= 7

# Test getting alerts (device_id filter)
def test_get_alerts_device_id_filter():
    response = client.get("/alerts?device_id=device_1")
    assert response.status_code == 200
    alerts = response.json()
    if alerts:  # Check if any alerts were returned
        for alert in alerts:
            assert alert["device_id"] == "device_1"









# Test getting settings
def test_get_settings():
    response = client.get("/settings")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test updating settings
def test_update_settings():
    new_settings = {
        "thresholds": {
            "temperature": {"warning": 65.0, "critical": 80.0}
        },
        "notifications": {
            "email": False,
            "sms": True
        }
    }

    settings = Settings(**new_settings)

    response = client.post("/settings", json=settings.dict())
    assert response.status_code == 200
    assert response.json()["thresholds"]["temperature"]["warning"] == 65.0
    assert response.json()["notifications"]["email"] == False

# Test health check
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"



# Test chat with AI (critical devices)
def test_chat_with_ai_critical_devices():
    chat_message = {"message": "critical devices"}
    response = client.post("/ai-chat", json=chat_message)
    assert response.status_code == 200

# Test chat with AI (warning devices)
def test_chat_with_ai_warning_devices():
    chat_message = {"message": "warning devices"}
    response = client.post("/ai-chat", json=chat_message)
    assert response.status_code == 200

# Test chat with AI (operational devices)
def test_chat_with_ai_operational_devices():
    chat_message = {"message": "operational devices"}
    response = client.post("/ai-chat", json=chat_message)
    assert response.status_code == 200

# Test getting failures (no filter)
def test_get_failures_no_filter():
    response = client.get("/failures")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting failures (type filter)
def test_get_failures_type_filter():
    response = client.get("/failures?type=hardware")
    assert response.status_code == 200
    failures = response.json()
    if failures:
        for failure in failures:
            assert failure["type"] == "hardware"

# Test getting failure stats
def test_get_failure_stats():
    response = client.get("/failure-stats")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test getting failure timeline
def test_get_failure_timeline():
    response = client.get("/failure-timeline")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting alert trends
def test_get_alert_trends():
    response = client.get("/alert-trends")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting maintenance costs
def test_get_maintenance_costs():
    response = client.get("/maintenance-costs")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test getting device status by ID (success)
def test_get_device_info_success():
    response = client.get("/device-status/device_1")
    assert response.status_code == 200
    assert response.json()["id"] == "device_1"

# Test getting device status by ID (failure)
def test_get_device_info_failure():
    response = client.get("/device-status/nonexistent_device")
    assert response.status_code == 404
    assert response.json()["detail"] == "Device not found"

# Test getting sensor data by device (success)
def test_get_device_sensor_data_success():
    response = client.get("/sensor-data/device_1")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting sensor data by device (failure)
def test_get_device_sensor_data_failure():
    response = client.get("/sensor-data/nonexistent_device")
    assert response.status_code == 404
    assert response.json()["detail"] == "Device not found"

# Test getting KPIs
def test_get_kpis():
    response = client.get("/dashboard/kpis")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test getting predictions
def test_get_predictions():
    response = client.get("/dashboard/predictions")
    assert response.status_code == 200
    assert isinstance(response.json(), list)



# Test getting sensor health
def test_get_sensor_health():
    response = client.get("/dashboard/sensor-health")
    assert response.status_code == 200
    assert isinstance(response.json(), list)



# Test getting maintenance recommendations
def test_get_maintenance_recommendations():
    response = client.get("/dashboard/maintenance-recommendations")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting root causes
def test_get_root_causes():
    response = client.get("/dashboard/root-causes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)



# Test getting dashboard statistics
def test_get_dashboard_statistics():
    response = client.get("/dashboard/statistics")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test getting device metrics report
def test_get_device_metrics():
    response = client.get("/reports/device-metrics")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test getting alert analysis report
def test_get_alert_analysis():
    response = client.get("/reports/alert-analysis")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test getting maintenance analysis report
def test_get_maintenance_analysis():
    response = client.get("/reports/maintenance-analysis")
    assert response.status_code == 200
    assert isinstance(response.json(), dict)

# Test data validation for creating a device
def test_create_device_data_validation():
    invalid_device = {
        "id": "test_device",
        "name": "Test Device",
        "location": "Test Location",
        "type": "Test Type",
        "status": "operational",
        "last_check": "invalid-date",  # Invalid date format
        "sensors": {"temperature": "invalid", "humidity": 50.0} # Invalid temperature type
    }
    response = client.post("/devices", json=invalid_device)
    assert response.status_code == 422  # Unprocessable Entity
    assert "last_check" in response.json()['detail'][0]['loc']
    assert "temperature" in response.json()['detail'][1]['loc']

# Test handling of missing data when creating a device
def test_create_device_missing_data():
    incomplete_device = {
        "id": "test_device",
        "name": "Test Device",
    }
    response = client.post("/devices", json=incomplete_device)
    assert response.status_code == 422 # Unprocessable Entity
    assert "location" in response.json()['detail'][0]['loc']
    assert "type" in response.json()['detail'][1]['loc']
    assert "status" in response.json()['detail'][2]['loc']
    assert "last_check" in response.json()['detail'][3]['loc']
    assert "sensors" in response.json()['detail'][4]['loc']







# Test failure with missing device id while calling device status
def test_get_device_status_with_missing_device_id():
    response = client.get("/device-status/missing_device_id")
    assert response.status_code == 404
    assert "Device not found" in response.json()["detail"]

# Test get failures with invalid failure type
def test_get_failures_with_invalid_failure_type():
    response = client.get("/failures?type=invalid_failure_type")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# Test data validation for chat message
def test_chat_with_ai_with_invalid_data():
    invalid_chat_message = {"message": 123}
    response = client.post("/ai-chat", json=invalid_chat_message)
    assert response.status_code == 422
    assert "message" in response.json()["detail"][0]["loc"]

# Test the API's response to a device having no alerts
def test_get_device_status_with_no_alerts_present():
    # Remove all alerts to simulate no alerts
    app.alerts = []
    response = client.get("/device-status")
    assert response.status_code == 200
    response_json = response.json()





# Test updating settings with string instead of float
def test_update_settings_invalid_data_type():
    invalid_settings = {
        "thresholds": {
            "temperature": {"warning": "invalid", "critical": "invalid"}
        },
        "notifications": {
            "email": True,
            "sms": False
        }
    }
    response = client.post("/settings", json=invalid_settings)
    assert response.status_code == 422
    assert "temperature" in response.json()["detail"][0]['loc']



# Test getting alert trends when there are no alerts
def test_get_alert_trends_no_alerts():
    app.alerts = []
    response = client.get("/alert-trends")
    assert response.status_code == 200
    assert isinstance(response.json(), list)









# Test that dashboard statistics are calculated correctly
def test_dashboard_statistics():
    response = client.get("/dashboard/statistics")
    assert response.status_code == 200
    json = response.json()
    assert "alerts" in json
    assert "devices" in json



# Testing device-wise alert distributions using the alert report.
def test_alert_reports_for_device_with_alerts():
    # Add a custom alert for testing device-wise alert distribution
    custom_alert = {
        "id": "device_alert_test",
        "timestamp": datetime.now().isoformat(),
        "device_id": "device_1",
        "alert_type": "PREDICTIVE_MAINTENANCE",
        "severity": 8,
        "message": "High probability of device failure detected (ML)",
        "details": {
            "probability": 0.8,
            "sensor_readings": {"temperature": 28.0, "humidity": 60.0},
            "recommended_action": "Schedule maintenance check"
        },
        "acknowledged": False
    }
    app.alerts.append(custom_alert)

    # Retrieve the alert analysis report
    response = client.get("/reports/alert-analysis")
    assert response.status_code == 200
    alert_analysis = response.json()

    # Check the device-wise distribution for our custom alert
    assert "device_1" in alert_analysis["device_distribution"]


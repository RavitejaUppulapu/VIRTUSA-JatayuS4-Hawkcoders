import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const DeviceInfo = () => {
  const { deviceId } = useParams();
  const [device, setDevice] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeviceInfo = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/device-status/${deviceId}`);
        setDevice(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch device information");
      } finally {
        setLoading(false);
      }
    };

    const fetchSensorData = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/sensor-data/${deviceId}`);
        setSensorData(response.data);
      } catch (err) {
        console.error("Failed to fetch sensor data", err);
      }
    };

    fetchDeviceInfo();
    fetchSensorData();
  }, [deviceId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box p={2} sx={{ backgroundColor: "#f5f5f5" }}>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        {device.name}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Location: <strong>{device.location}</strong>
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Type: <strong>{device.type}</strong>
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Status: <strong>{device.status}</strong>
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Last Check: <strong>{new Date(device.last_check).toLocaleString()}</strong>
      </Typography>
      <Typography variant="h6" fontWeight="bold" mt={2}>
        Sensor Data:
      </Typography>
      {Object.keys(device.sensors).map((sensor, idx) => (
        <Box key={sensor} sx={{ height: 300, mb: 4 }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
            {sensor.replace("_", " ")}
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey={sensor}
                stroke={`hsl(${idx * 45}, 70%, 50%)`}
                strokeWidth={2}
                dot={false}
                name={sensor}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ))}
    </Box>
  );
};

export default DeviceInfo; 
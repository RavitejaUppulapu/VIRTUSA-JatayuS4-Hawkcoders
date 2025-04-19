import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sensorData, setSensorData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesRes, alertsRes, sensorRes] = await Promise.all([
          axios.get("http://localhost:8000/devices"),
          axios.get("http://localhost:8000/alerts"),
          axios.get("http://localhost:8000/sensor-data"),
        ]);

        setDevices(devicesRes.data);
        setAlerts(alertsRes.data);

        // Transform sensor data for the chart
        const transformedData = [];
        const sensorHistory = sensorRes.data;

        // Get the latest 10 readings from each device
        Object.values(sensorHistory).forEach((deviceData) => {
          deviceData.slice(-10).forEach((reading) => {
            // Ensure all sensor values are numbers with default value of 0
            transformedData.push({
              timestamp: reading.timestamp,
              temperature: Number(reading.temperature) || 0,
              humidity: Number(reading.humidity) || 0,
              vibration: Number(reading.vibration) || 0,
            });
          });
        });

        // Sort by timestamp and take only the last 15 readings
        transformedData.sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
        setSensorData(transformedData.slice(-15));
        setError(null);
      } catch (error) {
        setError("Failed to fetch dashboard data");
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "#4caf50";
      case "warning":
        return "#ff9800";
      case "critical":
        return "#dc3545";
      default:
        return "#0288d1";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "#e8f5e9";
      case "warning":
        return "#fff3e0";
      case "critical":
        return "#ffebee";
      default:
        return "#e3f2fd";
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
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
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Overview
      </Typography>

      {/* Device Status */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Device Status
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {devices.map((device) => (
          <Grid item xs={12} sm={6} md={4} key={device.id}>
            <Paper
              sx={{
                p: 2,
                bgcolor: getStatusBgColor(device.status),
                border: 1,
                borderColor: getStatusColor(device.status),
              }}
            >
              <Typography variant="h6" gutterBottom>
                {device.name}
              </Typography>
              <Typography>Status: {device.status}</Typography>
              <Typography>Location: {device.location}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Active Alerts */}
      <Typography variant="h6" gutterBottom>
        Active Alerts
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {alerts.map((alert) => (
          <Grid item xs={12} sm={6} key={alert.id}>
            <Paper
              sx={{
                p: 2,
                bgcolor:
                  alert.severity >= 7
                    ? "#ffebee"
                    : alert.severity >= 4
                    ? "#fff3e0"
                    : "#e3f2fd",
                border: 1,
                borderColor:
                  alert.severity >= 7
                    ? "#dc3545"
                    : alert.severity >= 4
                    ? "#ff9800"
                    : "#0288d1",
              }}
            >
              <Typography variant="subtitle1">
                Device: {alert.device_id}
              </Typography>
              <Typography>{alert.message}</Typography>
              <Typography variant="body2" color="textSecondary">
                Severity: {alert.severity}/10
              </Typography>
            </Paper>
          </Grid>
        ))}
        {alerts.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="success">No active alerts</Alert>
          </Grid>
        )}
      </Grid>

      {/* Sensor Readings */}
      <Typography variant="h6" gutterBottom>
        Sensor Readings
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={sensorData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              interval="preserveStartEnd"
            />
            <YAxis domain={[0, "auto"]} />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleString()}
              formatter={(value) => [value.toFixed(2), ""]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#dc3545"
              name="Temperature"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke="#0288d1"
              name="Humidity"
              dot={false}
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="vibration"
              stroke="#ff9800"
              name="Vibration"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};

export default Dashboard;

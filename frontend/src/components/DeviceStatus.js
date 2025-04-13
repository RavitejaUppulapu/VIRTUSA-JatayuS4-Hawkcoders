import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import axios from "axios";

const DeviceStatus = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesResponse, sensorResponse] = await Promise.all([
          axios.get("http://localhost:8000/devices"),
          axios.get("http://localhost:8000/sensor-data"),
        ]);
        setDevices(devicesResponse.data);
        setSensorData(sensorResponse.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch device data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return "success";
      case "warning":
        return "warning";
      case "critical":
        return "error";
      default:
        return "default";
    }
  };

  const formatSensorData = (deviceId) => {
    if (!sensorData[deviceId]) return [];
    return sensorData[deviceId].map((reading, index) => ({
      name: index,
      temperature: reading.temperature,
      humidity: reading.humidity,
      vibration: reading.vibration,
    }));
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
        Device Status
      </Typography>
      <Grid container spacing={3}>
        {devices.map((device) => (
          <Grid item xs={12} md={6} lg={4} key={device.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{device.name}</Typography>
                <Box display="flex" alignItems="center" mb={2}>
                  <Chip
                    label={device.status}
                    color={getStatusColor(device.status)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography color="textSecondary" variant="body2">
                    Last Check: {new Date().toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary">
                  Location: {device.location}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Type: {device.type}
                </Typography>
                {device.sensors && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Sensor Readings:
                    </Typography>
                    <Box height={200} mb={2}>
                      <LineChart
                        width={300}
                        height={200}
                        data={formatSensorData(device.id)}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="temperature"
                          stroke="#8884d8"
                          name="Temperature"
                        />
                        <Line
                          type="monotone"
                          dataKey="humidity"
                          stroke="#82ca9d"
                          name="Humidity"
                        />
                        <Line
                          type="monotone"
                          dataKey="vibration"
                          stroke="#ffc658"
                          name="Vibration"
                        />
                      </LineChart>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          Temperature: {device.sensors.temperature}°C
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          Humidity: {device.sensors.humidity}%
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2">
                          Vibration: {device.sensors.vibration}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DeviceStatus;

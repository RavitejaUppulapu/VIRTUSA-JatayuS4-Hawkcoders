import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
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
} from "recharts";
import axios from "axios";

const DeviceStatus = () => {
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        setError("Failed to fetch device status");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

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

  if (!devices || devices.length === 0) {
    return (
      <Box p={3}>
        <Alert severity="info">No devices found</Alert>
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
                <Typography variant="h6" gutterBottom>
                  {device.name}
                </Typography>
                <Chip
                  label={device.status.toUpperCase()}
                  color={
                    device.status === "healthy"
                      ? "success"
                      : device.status === "warning"
                      ? "warning"
                      : "error"
                  }
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Location: {device.location}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Type: {device.type}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Last Check: {new Date(device.last_check).toLocaleString()}
                </Typography>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Sensor Readings:
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={12}>
                    <Box height={200}>
                      <LineChart
                        width={300}
                        height={180}
                        data={sensorData
                          .filter((d) => d.device_id === device.id)
                          .slice(-10)}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="timestamp" tick={false} />
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
                  </Grid>
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DeviceStatus;

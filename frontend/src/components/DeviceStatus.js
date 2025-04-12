import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import axios from "axios";

const DeviceStatus = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get("http://localhost:8000/devices");
        setDevices(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch device status");
        console.error("Error fetching devices:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 30000); // Refresh every 30 seconds
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
                <Typography color="textSecondary" gutterBottom>
                  ID: {device.id}
                </Typography>
                <Typography variant="body1">
                  Status:{" "}
                  <span className={`status-${device.status.toLowerCase()}`}>
                    {device.status}
                  </span>
                </Typography>
                <Typography variant="body2">
                  Location: {device.location}
                </Typography>
                <Typography variant="body2">Type: {device.type}</Typography>
                {device.sensors && (
                  <Box mt={2}>
                    <Typography variant="subtitle2">
                      Sensor Readings:
                    </Typography>
                    <Typography variant="body2">
                      Temperature: {device.sensors.temperature}°C
                    </Typography>
                    <Typography variant="body2">
                      Humidity: {device.sensors.humidity}%
                    </Typography>
                    <Typography variant="body2">
                      Vibration: {device.sensors.vibration}
                    </Typography>
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

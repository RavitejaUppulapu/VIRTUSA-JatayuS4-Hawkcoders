import React, { useState, useEffect } from "react";
import { Box, Grid, Paper, Typography, Card, CardContent } from "@mui/material";
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

const Dashboard = () => {
  const [deviceStatus, setDeviceStatus] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [sensorData, setSensorData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, alertsRes, sensorRes] = await Promise.all([
          axios.get("http://localhost:8000/device-status"),
          axios.get("http://localhost:8000/alerts"),
          axios.get("http://localhost:8000/sensor-data"),
        ]);
        setDeviceStatus(statusRes.data);
        setAlerts(alertsRes.data);
        setSensorData(sensorRes.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Overview
      </Typography>

      <Grid container spacing={3}>
        {/* Device Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Status
            </Typography>
            <Grid container spacing={2}>
              {Object.entries(deviceStatus).map(([deviceId, device]) => (
                <Grid item xs={12} sm={6} md={4} key={deviceId}>
                  <Card
                    sx={{
                      bgcolor:
                        device.status === "healthy"
                          ? "success.light"
                          : device.status === "warning"
                          ? "warning.light"
                          : "error.light",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">{device.name}</Typography>
                      <Typography>Status: {device.status}</Typography>
                      <Typography>Location: {device.location}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Active Alerts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Alerts
            </Typography>
            <Grid container spacing={2}>
              {alerts.slice(0, 3).map((alert) => (
                <Grid item xs={12} sm={6} md={4} key={alert.id}>
                  <Card
                    sx={{
                      bgcolor:
                        alert.severity > 7
                          ? "error.light"
                          : alert.severity > 4
                          ? "warning.light"
                          : "info.light",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6">
                        Device: {alert.device_id}
                      </Typography>
                      <Typography>{alert.message}</Typography>
                      <Typography variant="body2">
                        Severity: {alert.severity}/10
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Sensor Charts */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sensor Readings
            </Typography>
            <LineChart
              width={800}
              height={400}
              data={sensorData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="temperature" stroke="#8884d8" />
              <Line type="monotone" dataKey="humidity" stroke="#82ca9d" />
              <Line type="monotone" dataKey="vibration" stroke="#ffc658" />
            </LineChart>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import axios from "axios";

const Settings = () => {
  const [settings, setSettings] = useState({
    thresholds: {
      temperature: { warning: 65, critical: 75 },
      humidity: { warning: 70, critical: 85 },
      vibration: { warning: 4.0, critical: 5.0 },
    },
    notifications: {
      email: true,
      sms: false,
    },
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("http://localhost:8000/settings");
        setSettings(response.data);
      } catch (error) {
        console.error("Error fetching settings:", error);
        setSnackbar({
          open: true,
          message: "Failed to load settings",
          severity: "error",
        });
      }
    };
    fetchSettings();
  }, []);

  const handleThresholdChange = (sensor, type, value) => {
    setSettings((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [sensor]: {
          ...prev.thresholds[sensor],
          [type]: parseFloat(value),
        },
      },
    }));
  };

  const handleNotificationChange = (type) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
  };

  const handleSave = async () => {
    try {
      await axios.post("http://localhost:8000/settings", settings);
      setSnackbar({
        open: true,
        message: "Settings saved successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      setSnackbar({
        open: true,
        message: "Failed to save settings",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Threshold Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Threshold Settings
            </Typography>
            <Grid container spacing={3}>
              {/* Temperature Thresholds */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Temperature (°C)
                </Typography>
                <TextField
                  label="Warning"
                  type="number"
                  value={settings.thresholds.temperature.warning}
                  onChange={(e) =>
                    handleThresholdChange(
                      "temperature",
                      "warning",
                      e.target.value
                    )
                  }
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Critical"
                  type="number"
                  value={settings.thresholds.temperature.critical}
                  onChange={(e) =>
                    handleThresholdChange(
                      "temperature",
                      "critical",
                      e.target.value
                    )
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              {/* Humidity Thresholds */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Humidity (%)
                </Typography>
                <TextField
                  label="Warning"
                  type="number"
                  value={settings.thresholds.humidity.warning}
                  onChange={(e) =>
                    handleThresholdChange("humidity", "warning", e.target.value)
                  }
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Critical"
                  type="number"
                  value={settings.thresholds.humidity.critical}
                  onChange={(e) =>
                    handleThresholdChange(
                      "humidity",
                      "critical",
                      e.target.value
                    )
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>

              {/* Vibration Thresholds */}
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Vibration
                </Typography>
                <TextField
                  label="Warning"
                  type="number"
                  value={settings.thresholds.vibration.warning}
                  onChange={(e) =>
                    handleThresholdChange(
                      "vibration",
                      "warning",
                      e.target.value
                    )
                  }
                  fullWidth
                  margin="normal"
                />
                <TextField
                  label="Critical"
                  type="number"
                  value={settings.thresholds.vibration.critical}
                  onChange={(e) =>
                    handleThresholdChange(
                      "vibration",
                      "critical",
                      e.target.value
                    )
                  }
                  fullWidth
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.email}
                  onChange={() => handleNotificationChange("email")}
                />
              }
              label="Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications.sms}
                  onChange={() => handleNotificationChange("sms")}
                />
              }
              label="SMS Notifications"
            />
          </Paper>
        </Grid>

        {/* Save Button */}
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            size="large"
          >
            Save Settings
          </Button>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;

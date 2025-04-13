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
  Card,
  CardContent,
  Divider,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("http://localhost:8000/settings");
        setSettings(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch settings");
        console.error("Error fetching settings:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleThresholdChange = (metric, type, value) => {
    const numValue = parseFloat(value);
    setSettings((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [metric]: {
          ...prev.thresholds[metric],
          [type]: numValue,
        },
      },
    }));
    setIsDirty(true);
  };

  const handleNotificationChange = (type) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type],
      },
    }));
    setIsDirty(true);
  };

  const validateSettings = () => {
    const { thresholds } = settings;
    for (const metric of Object.keys(thresholds)) {
      if (thresholds[metric].warning >= thresholds[metric].critical) {
        return `${
          metric.charAt(0).toUpperCase() + metric.slice(1)
        } warning threshold must be lower than critical threshold`;
      }
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validateSettings();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await axios.post("http://localhost:8000/settings", settings);
      setSuccess(true);
      setIsDirty(false);
      setError(null);

      // Trigger a refresh of the dashboard and alerts components
      // This will be picked up by their polling mechanisms
    } catch (err) {
      setError("Failed to save settings");
      console.error("Error saving settings:", err);
    }
  };

  const handleReset = async () => {
    try {
      const response = await axios.get("http://localhost:8000/settings");
      setSettings(response.data);
      setIsDirty(false);
      setError(null);
    } catch (err) {
      setError("Failed to reset settings");
      console.error("Error resetting settings:", err);
    }
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Threshold Settings */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alert Thresholds
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure warning and critical thresholds for device sensors.
              Warning thresholds should be lower than critical thresholds.
            </Typography>
            <Grid container spacing={3}>
              {Object.entries(settings.thresholds).map(([metric, values]) => (
                <Grid item xs={12} key={metric}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {metric.charAt(0).toUpperCase() + metric.slice(1)}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Warning Threshold"
                            type="number"
                            value={values.warning}
                            onChange={(e) =>
                              handleThresholdChange(
                                metric,
                                "warning",
                                e.target.value
                              )
                            }
                            inputProps={{
                              step: metric === "vibration" ? "0.1" : "1",
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Critical Threshold"
                            type="number"
                            value={values.critical}
                            onChange={(e) =>
                              handleThresholdChange(
                                metric,
                                "critical",
                                e.target.value
                              )
                            }
                            inputProps={{
                              step: metric === "vibration" ? "0.1" : "1",
                            }}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Notification Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure how you want to receive alerts and notifications.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.email}
                    onChange={() => handleNotificationChange("email")}
                  />
                }
                label="Email Notifications"
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: 4, mb: 2 }}
              >
                Receive alerts and reports via email
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.sms}
                    onChange={() => handleNotificationChange("sms")}
                  />
                }
                label="SMS Notifications"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Receive urgent alerts via SMS
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={handleReset} disabled={!isDirty}>
          Reset Changes
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!isDirty}>
          Save Settings
        </Button>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Settings saved successfully
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;

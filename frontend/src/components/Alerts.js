import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import axios from "axios";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [devices, setDevices] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, devicesRes] = await Promise.all([
          axios.get("http://localhost:8000/alerts"),
          axios.get("http://localhost:8000/devices"),
        ]);
        setAlerts(alertsRes.data);
        setDevices(devicesRes.data);
      } catch (err) {
        console.error("Error fetching alerts:", err);
      }
    };

    fetchData();
    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      await axios.post(`http://localhost:8000/alerts/${alertId}/acknowledge`);
      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      );
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    }
  };

  const getSeverityIcon = (severity) => {
    if (severity > 7) return <ErrorIcon color="error" />;
    if (severity > 4) return <WarningIcon color="warning" />;
    return <InfoIcon color="info" />;
  };

  const getSeverityLabel = (severity) => {
    if (severity > 7) return "Critical";
    if (severity > 4) return "Warning";
    return "Info";
  };

  const getSeverityColor = (severity) => {
    if (severity > 7) return "error";
    if (severity > 4) return "warning";
    return "info";
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity !== "all") {
      const severityLevel = getSeverityLabel(alert.severity).toLowerCase();
      if (severityLevel !== selectedSeverity.toLowerCase()) return false;
    }
    if (selectedDevice !== "all" && alert.device_id !== selectedDevice)
      return false;
    return true;
  });

  const handleViewDetails = (alert) => {
    setSelectedAlert(alert);
    setOpenDialog(true);
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Alert Management System
      </Typography>

      {/* Alert Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="error" variant="h6">
                Critical Alerts
              </Typography>
              <Typography variant="h4">
                {alerts.filter((a) => a.severity > 7).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="warning" variant="h6">
                Warning Alerts
              </Typography>
              <Typography variant="h4">
                {alerts.filter((a) => a.severity > 4 && a.severity <= 7).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="info" variant="h6">
                Info Alerts
              </Typography>
              <Typography variant="h4">
                {alerts.filter((a) => a.severity <= 4).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={selectedSeverity}
              label="Severity"
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              <MenuItem value="all">All Severities</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
              <MenuItem value="info">Info</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Device</InputLabel>
            <Select
              value={selectedDevice}
              label="Device"
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <MenuItem value="all">All Devices</MenuItem>
              {devices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Alerts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Severity</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Alert Type</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  {getSeverityIcon(alert.severity)}
                  <Chip
                    label={getSeverityLabel(alert.severity)}
                    color={getSeverityColor(alert.severity)}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </TableCell>
                <TableCell>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  {devices.find((d) => d.id === alert.device_id)?.name ||
                    alert.device_id}
                </TableCell>
                <TableCell>{alert.alert_type}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  <Chip
                    label={alert.acknowledged ? "Acknowledged" : "New"}
                    color={alert.acknowledged ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleViewDetails(alert)}
                    title="View Details"
                  >
                    <VisibilityIcon />
                  </IconButton>
                  {!alert.acknowledged && (
                    <IconButton
                      size="small"
                      onClick={() => handleAcknowledge(alert.id)}
                      title="Acknowledge"
                    >
                      <CheckCircleIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Alert Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAlert.message}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Device</Typography>
                  <Typography gutterBottom>
                    {devices.find((d) => d.id === selectedAlert.device_id)
                      ?.name || selectedAlert.device_id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Alert Type</Typography>
                  <Typography gutterBottom>
                    {selectedAlert.alert_type}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Severity</Typography>
                  <Typography gutterBottom>
                    <Chip
                      label={`${getSeverityLabel(selectedAlert.severity)} (${
                        selectedAlert.severity
                      }/10)`}
                      color={getSeverityColor(selectedAlert.severity)}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography gutterBottom>
                    <Chip
                      label={
                        selectedAlert.acknowledged ? "Acknowledged" : "New"
                      }
                      color={selectedAlert.acknowledged ? "success" : "warning"}
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Details</Typography>
                  <Paper sx={{ p: 2, bgcolor: "grey.100" }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(selectedAlert.details, null, 2)}
                    </pre>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedAlert && !selectedAlert.acknowledged && (
            <Button
              onClick={() => {
                handleAcknowledge(selectedAlert.id);
                setOpenDialog(false);
              }}
              color="primary"
            >
              Acknowledge
            </Button>
          )}
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Alerts;

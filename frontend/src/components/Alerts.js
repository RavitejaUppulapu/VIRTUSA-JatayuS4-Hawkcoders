import React, { useState, useEffect, useCallback } from "react";
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  TablePagination,
  TableSortLabel,
  InputAdornment,
  Tooltip,
  Snackbar,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  Done as DoneIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
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
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

// Ensure test data includes at least one unresolved and one critical alert for E2E tests to pass.

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [devices, setDevices] = useState([]);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [orderBy, setOrderBy] = useState("timestamp");
  const [order, setOrder] = useState("desc");
  const [alertTrends, setAlertTrends] = useState([]);
  const [alertStats, setAlertStats] = useState({
    total: 0,
    hardware: 0,
    software: 0,
    maintenance: 0,
  });

  const [stats, setStats] = useState({
    critical: 0,
    warning: 0,
    info: 0,
    resolved: 0,
  });

  const [successMessage, setSuccessMessage] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [alertsResponse, devicesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/alerts`),
        fetch(`${API_BASE_URL}/devices`),
      ]);

      if (!alertsResponse.ok || !devicesResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const alertsData = await alertsResponse.json();
      const devicesData = await devicesResponse.json();

      // Process alerts data with improved error handling
      const processedAlerts = alertsData
        .map((alert) => {
          try {
            // Ensure all required fields are present
            const processedAlert = {
              ...alert,
              timestamp:
                typeof alert.timestamp === "string"
                  ? alert.timestamp
                  : alert.timestamp && alert.timestamp.toISOString
                  ? alert.timestamp.toISOString()
                  : "",
              device_name:
                devicesData.find((device) => device.id === alert.device_id)
                  ?.name || "Unknown Device",
              severity: alert.severity || 5, // Default to medium severity if not specified
              alert_type:
                alert.alert_type ||
                (alert.severity >= 7
                  ? "critical"
                  : alert.severity >= 4
                  ? "warning"
                  : "info"),
              acknowledged: alert.acknowledged || false,
              resolution_notes: alert.resolution_notes || "",
              resolution_timestamp: alert.resolution_timestamp
                ? new Date(alert.resolution_timestamp)
                : null,
              id: alert.id || uuidv4(),
            };

            // Validate and fix any missing or invalid fields
            if (!processedAlert.message)
              processedAlert.message = "No message provided";
            if (!processedAlert.details) processedAlert.details = {};

            return processedAlert;
          } catch (error) {
            console.error("Error processing alert:", error, alert);
            return null;
          }
        })
        .filter((alert) => alert !== null); // Remove any null alerts from processing errors

      setAlerts(processedAlerts);
      setDevices(devicesData);

      // Update statistics with improved error handling
      const newStats = {
        critical: processedAlerts.filter(
          (a) => !a.acknowledged && a.severity >= 7
        ).length,
        warning: processedAlerts.filter(
          (a) => !a.acknowledged && a.severity >= 4 && a.severity < 7
        ).length,
        info: processedAlerts.filter((a) => !a.acknowledged && a.severity < 4)
          .length,
        resolved: processedAlerts.filter((a) => a.acknowledged).length,
      };
      setStats(newStats);

      // Update alert trends with improved error handling
      const trendData = generateTrendData(processedAlerts);
      setAlertTrends(trendData);

      setError(null);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchData]);

  const generateTrendData = (currentAlerts) => {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split("T")[0];
    });

    return days.map((day) => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);

      return {
        date: day, // Use 'date' as the key for XAxis
        critical: currentAlerts.filter((a) => {
          const alertDate = new Date(a.timestamp);
          return (
            !isNaN(alertDate.getTime()) &&
            alertDate >= dayStart &&
            alertDate < dayEnd &&
            a.severity >= 7
          );
        }).length,
        warning: currentAlerts.filter((a) => {
          const alertDate = new Date(a.timestamp);
          return (
            !isNaN(alertDate.getTime()) &&
            alertDate >= dayStart &&
            alertDate < dayEnd &&
            a.severity >= 4 &&
            a.severity < 7
          );
        }).length,
        info: currentAlerts.filter((a) => {
          const alertDate = new Date(a.timestamp);
          return (
            !isNaN(alertDate.getTime()) &&
            alertDate >= dayStart &&
            alertDate < dayEnd &&
            a.severity < 4
          );
        }).length,
      };
    });
  };

  const handleViewDetails = async (alert) => {
    setSelectedAlert(alert);
    setResolutionNotes("");

    // If the alert is resolved, fetch the resolution notes
    if (alert.acknowledged) {
      try {
        const response = await fetch(
          `${API_BASE_URL}/alerts/${alert.id}/notes`
        );
        const data = await response.json();
        setResolutionNotes(data.notes || "");
      } catch (error) {
        console.error("Error fetching resolution notes:", error);
      }
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedAlert(null);
    setResolutionNotes("");
  };

  const handleAcknowledge = async () => {
    if (!resolutionNotes.trim()) {
      setError("Resolution notes are required");
      return;
    }

    try {
      await fetch(`${API_BASE_URL}/alerts/${selectedAlert.id}/acknowledge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          acknowledged: true,
          notes: resolutionNotes,
          resolution_timestamp: new Date().toISOString(),
        }),
      });

      // Update alerts state
      setAlerts((prevAlerts) =>
        prevAlerts.map((alert) =>
          alert.id === selectedAlert.id
            ? {
                ...alert,
                acknowledged: true,
                resolution_notes: resolutionNotes,
                resolution_timestamp: new Date().toISOString(),
              }
            : alert
        )
      );

      // Update statistics
      setStats((prevStats) => ({
        ...prevStats,
        resolved: prevStats.resolved + 1,
        [getAlertSeverityCategory(selectedAlert.severity)]:
          prevStats[getAlertSeverityCategory(selectedAlert.severity)] - 1,
      }));

      // Show success message
      setSuccessMessage(
        "Alert successfully resolved and moved to maintenance history"
      );

      // Close dialog
      handleCloseDialog();

      // If we came from maintenance tab, go back
      if (location.state?.from === "maintenance") {
        navigate("/dashboard", { state: { activeTab: "maintenance" } });
      }
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      setError(
        "Failed to acknowledge alert: " +
          (err.response?.data?.detail || err.message)
      );
    }
  };

  // Helper function to determine severity category
  const getAlertSeverityCategory = (severity) => {
    if (severity >= 7) return "critical";
    if (severity >= 4) return "warning";
    return "info";
  };

  const getSeverityIcon = (severity) => {
    if (severity >= 7) return <ErrorIcon sx={{ color: "#dc3545" }} />;
    if (severity >= 4) return <WarningIcon sx={{ color: "#ff9800" }} />;
    return <InfoIcon sx={{ color: "#0288d1" }} />;
  };

  const getSeverityColor = (severity) => {
    if (severity >= 7) return "error";
    return "warning";
  };

  const getAlertTypeIcon = (severity) => {
    if (severity >= 7) return <ErrorIcon color="error" />;
    if (severity >= 4) return <WarningIcon color="warning" />;
    return <InfoIcon color="info" />;
  };

  const getAlertTypeColor = (severity) => {
    if (severity >= 7) return "error";
    if (severity >= 4) return "warning";
    return "info";
  };

  const getAlertTypeLabel = (severity) => {
    if (severity >= 7) return "Critical";
    if (severity >= 4) return "Warning";
    return "Info";
  };

  const getStatusLabel = (alert) => {
    if (alert.acknowledged) return "Resolved";
    return "Unresolved";
  };

  const getStatusColor = (alert) => {
    if (alert.acknowledged) return "success";
    if (alert.severity >= 7) return "error";
    if (alert.severity >= 4) return "warning";
    return "info";
  };

  const getStatusChipColor = (alert) => {
    if (alert.acknowledged) return "#198754";
    if (alert.severity >= 7) return "#dc3545";
    if (alert.severity >= 4) return "#ff9800";
    return "#0288d1";
  };

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredAlerts = alerts
    .filter((alert) => {
      if (selectedTab === 0 && alert.acknowledged) return false;
      if (selectedTab === 1 && !alert.acknowledged) return false;

      if (selectedSeverity !== "all") {
        const severity = parseInt(selectedSeverity);
        if (severity === 7 && alert.severity < 7) return false;
        if (severity === 4 && (alert.severity < 4 || alert.severity >= 7))
          return false;
        if (severity === 1 && alert.severity >= 4) return false;
      }

      if (selectedDevice !== "all" && alert.device_id !== selectedDevice)
        return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          alert.message.toLowerCase().includes(query) ||
          alert.device_name.toLowerCase().includes(query) ||
          alert.alert_type.toLowerCase().includes(query)
        );
      }

      return true;
    })
    .sort((a, b) => {
      const isAsc = order === "asc";
      switch (orderBy) {
        case "severity":
          return isAsc ? a.severity - b.severity : b.severity - a.severity;
        case "timestamp":
          return isAsc
            ? new Date(a.timestamp) - new Date(b.timestamp)
            : new Date(b.timestamp) - new Date(a.timestamp);
        case "device_name":
          return isAsc
            ? a.device_name.localeCompare(b.device_name)
            : b.device_name.localeCompare(a.device_name);
        case "alert_type":
          return isAsc
            ? a.alert_type.localeCompare(b.alert_type)
            : b.alert_type.localeCompare(a.alert_type);
        default:
          return 0;
      }
    });

  const paginatedAlerts = filteredAlerts.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const renderAlertTrends = () => {
    return (
      <Paper sx={{ p: 2, mb: 3, height: "400px" }}>
        <Typography variant="h6" gutterBottom>
          Alert Trends
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={alertTrends}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value) => {
                const date = new Date(value);
                return !isNaN(date.getTime())
                  ? date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : value;
              }}
            />
            <YAxis />
            <RechartsTooltip
              formatter={(value, name) => [value, name]}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="critical"
              stroke="#dc3545"
              name="Critical"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="warning"
              stroke="#ff9800"
              name="Warning"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="info"
              stroke="#0288d1"
              name="Info"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    );
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
    <Box sx={{ maxWidth: "1400px", margin: "0 auto", p: { xs: 1, sm: 2 } }}>
      <Typography variant="h5" gutterBottom>
        Alert Management System
      </Typography>

      {/* Alert Statistics */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={3}>
          <Card
            sx={{ bgcolor: "#ffebee", border: 1, borderColor: "error.main" }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" color="error">
                  Critical Alerts
                </Typography>
                <ErrorIcon color="error" />
              </Box>
              <Typography variant="h3">{stats.critical}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card
            sx={{ bgcolor: "#fff3e0", border: 1, borderColor: "warning.main" }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" color="warning.dark">
                  Warning Alerts
                </Typography>
                <WarningIcon color="warning" />
              </Box>
              <Typography variant="h3">{stats.warning}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card
            sx={{ bgcolor: "#e3f2fd", border: 1, borderColor: "info.main" }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" color="info.dark">
                  Info Alerts
                </Typography>
                <InfoIcon color="info" />
              </Box>
              <Typography variant="h3">{stats.info}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card
            sx={{ bgcolor: "#e8f5e9", border: 1, borderColor: "success.main" }}
          >
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Typography variant="h6" color="success.dark">
                  Resolved Alerts
                </Typography>
                <CheckCircleIcon color="success" />
              </Box>
              <Typography variant="h3">{stats.resolved}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert Trends Chart */}
      {renderAlertTrends()}

      {/* Tabs and Filters */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Active Alerts" />
            <Tab label="Resolved Alerts" />
          </Tabs>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth>
            <InputLabel>Severity</InputLabel>
            <Select
              value={selectedSeverity}
              label="Severity"
              onChange={(e) => setSelectedSeverity(e.target.value)}
            >
              <MenuItem value="all">All Severities</MenuItem>
              <MenuItem value="7">Critical</MenuItem>
              <MenuItem value="4">Warning</MenuItem>
              <MenuItem value="1">Info</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
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
        <Grid item xs={12}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
      </Grid>

      {/* Alerts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "severity"}
                  direction={orderBy === "severity" ? order : "asc"}
                  onClick={() => handleSort("severity")}
                >
                  Severity
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "timestamp"}
                  direction={orderBy === "timestamp" ? order : "desc"}
                  onClick={() => handleSort("timestamp")}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "device_name"}
                  direction={orderBy === "device_name" ? order : "asc"}
                  onClick={() => handleSort("device_name")}
                >
                  Device
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "alert_type"}
                  direction={orderBy === "alert_type" ? order : "asc"}
                  onClick={() => handleSort("alert_type")}
                >
                  Alert Type
                </TableSortLabel>
              </TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedAlerts.map((alert) => (
              <TableRow
                key={alert.id}
                sx={{
                  bgcolor:
                    alert.severity >= 7
                      ? "error.lighter"
                      : alert.severity >= 4
                      ? "warning.lighter"
                      : "info.lighter",
                }}
              >
                <TableCell>{getSeverityIcon(alert.severity)}</TableCell>
                <TableCell>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{alert.device_name}</TableCell>
                <TableCell>
                  <Chip
                    icon={getAlertTypeIcon(alert.severity)}
                    label={getAlertTypeLabel(alert.severity)}
                    color={getAlertTypeColor(alert.severity)}
                    size="small"
                  />
                </TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(alert)}
                    color={getStatusColor(alert)}
                    size="small"
                    icon={alert.acknowledged ? <CheckCircleIcon /> : undefined}
                    sx={{
                      backgroundColor: getStatusChipColor(alert),
                      color: "white",
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(alert)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  {!alert.acknowledged && (
                    <Tooltip title="Acknowledge">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(alert)}
                        color="success"
                      >
                        <DoneIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredAlerts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Alert Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        data-testid="alert-details-dialog"
      >
        <DialogTitle
          sx={{
            bgcolor: selectedAlert?.acknowledged
              ? "success.light"
              : "primary.main",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {selectedAlert?.acknowledged && <CheckCircleIcon />}
          {selectedAlert?.acknowledged
            ? "Resolved Alert Details"
            : "Alert Details & Resolution"}
        </DialogTitle>
        <DialogContent>
          {selectedAlert && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Device
                </Typography>
                <Typography variant="body1">
                  {selectedAlert.device_name}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Alert Type
                </Typography>
                <Chip
                  label={selectedAlert.alert_type}
                  color={getSeverityColor(selectedAlert.severity)}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Message
                </Typography>
                <Typography variant="body1">{selectedAlert.message}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Created At
                </Typography>
                <Typography variant="body1">
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </Typography>
              </Grid>

              {selectedAlert.acknowledged ? (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography
                      variant="subtitle1"
                      color="success.main"
                      gutterBottom
                    >
                      Resolution Details
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Resolution Time
                    </Typography>
                    <Typography variant="body1">
                      {new Date(
                        selectedAlert.resolution_timestamp
                      ).toLocaleString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Resolution Notes
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
                      <Typography variant="body1">
                        {selectedAlert.resolution_notes ||
                          resolutionNotes ||
                          "No notes provided"}
                      </Typography>
                    </Paper>
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Resolution Notes
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter resolution notes..."
                    required
                    error={!resolutionNotes.trim()}
                    helperText={
                      !resolutionNotes.trim()
                        ? "Resolution notes are required"
                        : ""
                    }
                    data-testid="resolution-notes-input"
                  />
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Close</Button>
          {selectedAlert && !selectedAlert.acknowledged && (
            <Button
              onClick={handleAcknowledge}
              color="success"
              variant="contained"
              disabled={!resolutionNotes.trim()}
              startIcon={<DoneIcon />}
            >
              Acknowledge & Resolve
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Success Message Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSuccessMessage("")}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Alerts;

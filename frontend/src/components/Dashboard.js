import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Stack,
  Dialog,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  DialogTitle,
  TableSortLabel,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Build as BuildIcon,
  Timeline as TimelineIcon,
  Notifications as NotificationsIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  DeviceHub as DeviceHubIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Launch as LaunchIcon,
  ExpandLess as ExpandLessIcon,
  Circle as CircleIcon,
} from "@mui/icons-material";
import axios from "axios";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const SEVERITY_COLORS = {
  critical: "#dc3545",
  high: "#ff9800",
  medium: "#ffd700",
  low: "#4caf50",
  warning: "#ff9800",
  info: "#0288d1",
};

const SEVERITY_LEVELS = {
  critical: 4,
  high: 3,
  warning: 2,
  medium: 2,
  info: 1,
  low: 1,
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [predictedFailures, setPredictedFailures] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [maintenanceRecommendations, setMaintenanceRecommendations] = useState(
    []
  );
  const [selectedFailure, setSelectedFailure] = useState(null);
  const [environmentalAlerts, setEnvironmentalAlerts] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // New state variables for filtering and statistics
  const [timeFilter, setTimeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [componentFilter, setComponentFilter] = useState("all");
  const [statistics, setStatistics] = useState({
    totalPredictions: 0,
    criticalIssues: 0,
    plannedMaintenance: 0,
    resolvedIssues: 0,
  });

  // New state variables for enhanced features
  const [viewMode, setViewMode] = useState("list");
  const [trendData, setTrendData] = useState([]);
  const [deviceHealth, setDeviceHealth] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [selectedDateRange, setSelectedDateRange] = useState("7d");

  const [analysisData, setAnalysisData] = useState({});
  const [movingAlerts, setMovingAlerts] = useState({});

  const navigate = useNavigate();

  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [maintenancePlans, setMaintenancePlans] = useState({});

  const [orderBy, setOrderBy] = useState("severity");
  const [order, setOrder] = useState("desc");

  const fetchData = async () => {
    try {
      console.log("Fetching data from:", API_BASE_URL);

      // Test endpoint first
      try {
        const testResponse = await axios.get(`${API_BASE_URL}/`);
        console.log("API connection test successful:", testResponse.data);
      } catch (error) {
        console.error("API connection test failed:", error);
        throw new Error("Could not connect to API server");
      }

      // Fetch all required data in parallel
      const [alertsRes, devicesRes, environmentalRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/alerts`),
        axios.get(`${API_BASE_URL}/devices`),
        axios.get(`${API_BASE_URL}/dashboard/environmental`),
      ]);

      // Process alerts data with proper severity handling
      const processedAlerts = (alertsRes.data || []).map((alert) => ({
        id: alert.id || Math.random().toString(36).substr(2, 9),
        type: alert.type || "system",
        severity: alert.severity || "low",
        message: alert.message || "No message available",
        timestamp: alert.timestamp || new Date().toISOString(),
        device_id: alert.device_id || "",
        device_name:
          alert.device_name || getDeviceName(alert.device_id, devicesRes.data),
        alert_type: alert.alert_type || "system",
        status: alert.status || "unresolved",
        component: alert.component || "Unknown",
        location:
          alert.location || getDeviceLocation(alert.device_id, devicesRes.data),
        acknowledged: alert.acknowledged || false,
        resolution_notes:
          alert.resolution_notes || alert.resolutionNotes || null,
        resolution_timestamp:
          alert.resolution_timestamp || alert.resolutionTimestamp || null,
        resolved_by: alert.resolved_by || alert.resolvedBy || null,
      }));

      // Process environmental alerts with proper severity handling
      const processedEnvironmentalAlerts = (environmentalRes.data || []).map(
        (alert) => ({
          id: alert.id || Math.random().toString(36).substr(2, 9),
          type: "environmental",
          severity: alert.severity || "warning",
          message: alert.description || "No message available",
          timestamp: alert.start_time || new Date().toISOString(),
          device_id: alert.affected_devices?.[0] || "",
          device_name: getDeviceName(
            alert.affected_devices?.[0],
            devicesRes.data
          ),
          alert_type: "environmental",
          status: "unresolved",
          component: alert.type || "Environmental",
          location: getDeviceLocation(
            alert.affected_devices?.[0],
            devicesRes.data
          ),
          affected_devices: alert.affected_devices || [],
          acknowledged: alert.acknowledged || false,
        })
      );

      // Combine and sort all alerts
      const allAlerts = [
        ...processedAlerts,
        ...processedEnvironmentalAlerts,
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAlerts(allAlerts);
      setEnvironmentalAlerts(processedEnvironmentalAlerts);
      setDevices(devicesRes.data || []);

      // Fetch analysis data for all alerts
      const analysisPromises = allAlerts.map(async (alert) => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/predictions/analysis/${alert.id}`
          );
          return { [alert.id]: response.data };
        } catch (error) {
          console.error(
            `Error fetching analysis for alert ${alert.id}:`,
            error
          );
          return { [alert.id]: null };
        }
      });

      const analysisResults = await Promise.all(analysisPromises);
      const combinedAnalysisData = analysisResults.reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {}
      );
      setAnalysisData(combinedAnalysisData);

      // Update statistics
      const stats = {
        total: allAlerts.length,
        critical: allAlerts.filter(
          (a) => !a.acknowledged && a.severity === "critical"
        ).length,
        warning: allAlerts.filter(
          (a) => !a.acknowledged && a.severity === "warning"
        ).length,
        info: allAlerts.filter((a) => !a.acknowledged && a.severity === "info")
          .length,
        resolved: allAlerts.filter((a) => a.acknowledged).length,
      };
      setStatistics(stats);

      setError(null);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to fetch alerts data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate device health
  const calculateDeviceHealth = (devices, sensorData, predictions) => {
    return devices.map((device) => {
      const devicePredictions = predictions.filter(
        (p) => p.device_id === device.id
      );
      const avgRiskScore =
        devicePredictions.length > 0
          ? devicePredictions.reduce((acc, curr) => acc + curr.risk_score, 0) /
            devicePredictions.length
          : 0;

      return {
        device_id: device.id,
        device_name: device.name,
        health_score: Math.max(0, 100 - avgRiskScore * 100),
        risk_score: avgRiskScore * 100,
      };
    });
  };

  // Helper function to generate trend data
  const generateTrendData = (predictions) => {
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    }).reverse();

    return dates.map((date) => ({
      date,
      predictions: predictions.filter((p) => p.prediction_time.startsWith(date))
        .length,
      actual_failures:
        predictions.filter(
          (p) => p.failure_time.startsWith(date) && p.status === "failed"
        ).length || 0,
    }));
  };

  // Helper function to get device name
  const getDeviceName = (deviceId, devices) => {
    const device = devices.find((d) => d.id === deviceId);
    return device ? device.name : "Unknown Device";
  };

  // Helper function to get device location
  const getDeviceLocation = (deviceId, devices) => {
    const device = devices.find((d) => d.id === deviceId);
    return device ? device.location : "Unknown Location";
  };

  // Helper function to determine severity from risk score
  const getSeverityFromRiskScore = (riskScore) => {
    if (riskScore >= 0.8) return "critical";
    if (riskScore >= 0.6) return "high";
    if (riskScore >= 0.4) return "warning";
    if (riskScore >= 0.2) return "medium";
    return "low";
  };

  // Update statistics to include both predictions and alerts
  const updateStatistics = (predictions, alerts) => {
    const stats = {
      totalPredictions: predictions.length,
      criticalIssues:
        predictions.filter((p) => p.severity === "critical").length +
        alerts.filter((a) => a.severity === "critical").length,
      plannedMaintenance: maintenanceRecommendations.length,
      resolvedIssues: [...predictions, ...alerts].filter(
        (item) => item.status === "resolved"
      ).length,
      activeAlerts: alerts.filter((a) => a.status === "unresolved").length,
      warningAlerts: alerts.filter((a) => a.severity === "warning").length,
      criticalAlerts: alerts.filter((a) => a.severity === "critical").length,
    };
    setStatistics(stats);
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "healthy":
      case "operational":
        return "#4caf50";
      case "warning":
      case "standby":
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
      case "operational":
        return "#e8f5e9";
      case "warning":
      case "standby":
        return "#fff3e0";
      case "critical":
        return "#ffebee";
      default:
        return "#e3f2fd";
    }
  };

  const sortPredictedFailures = (failures) => {
    return [...failures].sort((a, b) => {
      // First, sort by device (group issues for the same device)
      if (a.device_id !== b.device_id) {
        return a.device_id.localeCompare(b.device_id);
      }

      // Then by severity
      const severityDiff =
        SEVERITY_LEVELS[b.severity] - SEVERITY_LEVELS[a.severity];
      if (severityDiff !== 0) return severityDiff;

      // Then by time to failure (most imminent first)
      return new Date(a.failure_time) - new Date(b.failure_time);
    });
  };

  const calculateTimeDifference = (timestamp) => {
    const now = new Date();
    const predictionTime = new Date(timestamp);
    const diffInHours = Math.floor((now - predictionTime) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} days ago`;
    }
  };

  const handleMaintenanceAction = (failureId) => {
    // Find the failure and its corresponding maintenance recommendations
    const failure = predictedFailures.find((f) => f.id === failureId);
    if (failure) {
      const recommendation = maintenanceRecommendations.find(
        (r) => r.device_id === failure.device_id
      );

      // Set the selected failure to show its details
      setSelectedFailure(failure);

      // Switch to the maintenance tab
      setSelectedTab(3);

      // Scroll to the relevant maintenance recommendation if it exists
      if (recommendation) {
        const element = document.getElementById(
          `maintenance-${recommendation.id}`
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
  };

  const handleDeviceClick = (deviceId) => {
    setSelectedDevice(deviceId);
    // You can add navigation to device details page or show a modal
    // depending on your application's requirements
  };

  const handleShowDetails = (failure) => {
    setSelectedFailure(failure);
    setShowDetailsDialog(true);
  };

  const handleSensorIssue = async (alert) => {
    try {
      await axios.post(`${API_BASE_URL}/dashboard/sensor-health`, {
        device_id: alert.affected_devices[0],
        sensor_type: alert.sensor_type,
      });

      await fetchData();
    } catch (error) {
      console.error("Error troubleshooting sensor:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to initiate sensor troubleshooting. Please try again.";
      setError(errorMessage);
    }
  };

  const filterPredictions = (predictions) => {
    return predictions.filter((failure) => {
      // Time filter
      if (timeFilter !== "all") {
        const failureDate = new Date(failure.failure_time);
        const now = new Date();
        const days = (failureDate - now) / (1000 * 60 * 60 * 24);
        if (timeFilter === "week" && days > 7) return false;
        if (timeFilter === "month" && days > 30) return false;
      }

      // Component filter
      if (componentFilter !== "all" && failure.component !== componentFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        return (
          failure.device_name?.toLowerCase().includes(searchLower) ||
          failure.component?.toLowerCase().includes(searchLower) ||
          failure.failure_reason?.toLowerCase().includes(searchLower) ||
          failure.location?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  const handleViewAlert = (alert) => {
    navigate("/alerts", {
      state: {
        selectedAlert: alert,
        fromDashboard: true,
      },
    });
  };

  const renderStatisticsCards = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              Total Predictions
            </Typography>
            <Typography variant="h4">{statistics.totalPredictions}</Typography>
            <LinearProgress
              variant="determinate"
              value={(statistics.totalPredictions / 100) * 100}
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card
          sx={{ cursor: "pointer" }}
          onClick={() => navigate("/alerts", { state: { filter: "critical" } })}
        >
          <CardContent>
            <Typography color="error" gutterBottom>
              Critical Issues
            </Typography>
            <Typography variant="h4">{statistics.criticalIssues}</Typography>
            <LinearProgress
              variant="determinate"
              value={
                (statistics.criticalIssues / statistics.totalPredictions) * 100
              }
              color="error"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="primary" gutterBottom>
              Planned Maintenance
            </Typography>
            <Typography variant="h4">
              {statistics.plannedMaintenance}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                (statistics.plannedMaintenance / statistics.totalPredictions) *
                100
              }
              color="primary"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Typography color="success" gutterBottom>
              Resolved Issues
            </Typography>
            <Typography variant="h4">{statistics.resolvedIssues}</Typography>
            <LinearProgress
              variant="determinate"
              value={
                (statistics.resolvedIssues / statistics.totalPredictions) * 100
              }
              color="success"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderFilters = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="all">All Time</MenuItem>
            <MenuItem value="week">Next 7 Days</MenuItem>
            <MenuItem value="month">Next 30 Days</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel>Component</InputLabel>
          <Select
            value={componentFilter}
            onChange={(e) => setComponentFilter(e.target.value)}
            label="Component"
          >
            <MenuItem value="all">All Components</MenuItem>
            {Array.from(new Set(predictedFailures.map((f) => f.component))).map(
              (component) => (
                <MenuItem key={component} value={component}>
                  {component}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search predictions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />
      </Grid>
    </Grid>
  );

  const handleExport = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dashboard/export`,
        {
          device: componentFilter === "all" ? undefined : componentFilter,
          date_range: selectedDateRange,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `predictions-export-${format(new Date(), "yyyy-MM-dd")}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting data:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to export data. Please try again.";
      setError(errorMessage);
    }
  };

  const renderTrendAnalysis = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6">Failure Prediction Trends</Typography>
          <ToggleButtonGroup
            size="small"
            value={selectedDateRange}
            exclusive
            onChange={(e, value) => value && setSelectedDateRange(value)}
          >
            <ToggleButton value="7d">7D</ToggleButton>
            <ToggleButton value="30d">30D</ToggleButton>
            <ToggleButton value="90d">90D</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="predictions"
                name="Predictions"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
              <Area
                type="monotone"
                dataKey="actual_failures"
                name="Actual Failures"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );

  const renderDeviceHealth = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Device Health Overview
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviceHealth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="device_name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar
                    dataKey="health_score"
                    name="Health Score"
                    fill="#2196f3"
                  />
                  <Bar dataKey="risk_score" name="Risk Score" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <List>
              {deviceHealth.map((device) => (
                <ListItem key={device.device_id}>
                  <ListItemIcon>
                    <DeviceHubIcon
                      color={
                        device.health_score > 70
                          ? "success"
                          : device.health_score > 40
                          ? "warning"
                          : "error"
                      }
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={device.device_name}
                    secondary={`Health: ${device.health_score}% | Risk: ${device.risk_score}%`}
                  />
                </ListItem>
              ))}
            </List>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const renderFailurePredictions = () => {
    const filteredFailures = filterPredictions(predictedFailures);

    return (
      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Typography variant="h6">Predicted Failures</Typography>
          <Stack direction="row" spacing={2}>
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(e, value) => value && setViewMode(value)}
            >
              <ToggleButton value="list">
                <Tooltip title="List View">
                  <FilterListIcon />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="analytics">
                <Tooltip title="Analytics View">
                  <AssessmentIcon />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => setShowExportDialog(true)}
            >
              Export
            </Button>
          </Stack>
        </Box>

        {renderStatisticsCards()}
        {renderFilters()}

        {viewMode === "analytics" ? (
          <>
            {renderTrendAnalysis()}
            {renderDeviceHealth()}
          </>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Component</TableCell>
                  <TableCell>Failure Details</TableCell>
                  <TableCell>Predicted Timeline</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredFailures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography
                        variant="body1"
                        color="textSecondary"
                        sx={{ py: 3 }}
                      >
                        No predictions match your current filters
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFailures.map((failure) => (
                    <TableRow
                      key={failure.id}
                      sx={{
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                        borderLeft: 6,
                        borderLeftColor: (theme) => {
                          const riskScore = failure.risk_score || 0;
                          if (riskScore > 0.8) return theme.palette.error.main;
                          if (riskScore > 0.5)
                            return theme.palette.warning.main;
                          return theme.palette.success.main;
                        },
                      }}
                    >
                      <TableCell>
                        <Typography
                          variant="subtitle2"
                          sx={{ fontWeight: 500 }}
                        >
                          {failure.device_name || "Unknown Device"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Location: {failure.location}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {failure.component}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          System: {failure.system_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, mb: 1 }}
                          >
                            {failure.failure_reason || "Unknown Failure"}
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {failure.failure_description}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              size="small"
                              label={`Confidence: ${(
                                failure.confidence * 100
                              ).toFixed(1)}%`}
                              sx={{
                                mr: 1,
                                backgroundColor: (theme) =>
                                  theme.palette.grey[100],
                              }}
                            />
                            <Chip
                              size="small"
                              label={`Risk: ${(
                                failure.risk_score * 100
                              ).toFixed(1)}%`}
                              color={
                                failure.risk_score > 0.8
                                  ? "error"
                                  : failure.risk_score > 0.5
                                  ? "warning"
                                  : "success"
                              }
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Predicted:{" "}
                            {calculateTimeDifference(failure.prediction_time)}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            Expected Failure:{" "}
                            {new Date(
                              failure.failure_time
                            ).toLocaleDateString()}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={
                              calculateTimeRemaining(
                                failure.failure_time
                              ).includes("hours")
                                ? "error"
                                : "textSecondary"
                            }
                            sx={{ fontWeight: 500 }}
                          >
                            {calculateTimeRemaining(failure.failure_time)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="column" spacing={1}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<BuildIcon />}
                            onClick={() => handleMaintenanceAction(failure.id)}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                            }}
                          >
                            View Maintenance Plan
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<AssessmentIcon />}
                            onClick={() => handleShowDetails(failure)}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                            }}
                          >
                            View Analysis
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Export Dialog */}
        <Dialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
        >
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              Export Predictions
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Export Format</InputLabel>
              <Select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                label="Export Format"
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="xlsx">Excel</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                label="Date Range"
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="all">All Time</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleExport}>
              Export
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  };

  const calculateTimeRemaining = (failureTime) => {
    const now = new Date();
    const failure = new Date(failureTime);
    const diffInHours = Math.floor((failure - now) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return `${diffInHours} hours remaining`;
    } else {
      const days = Math.floor(diffInHours / 24);
      return `${days} days remaining`;
    }
  };

  const renderEnvironmentalIssues = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Environmental Alerts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Alert Type</TableCell>
              <TableCell>Affected Devices</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {environmentalAlerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>{alert.type}</TableCell>
                <TableCell>{alert.affected_devices.join(", ")}</TableCell>
                <TableCell>{alert.description}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<InfoIcon />}
                    onClick={() => handleSensorIssue(alert)}
                  >
                    Troubleshoot
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const MaintenanceTab = () => {
    const [expandedAlerts, setExpandedAlerts] = useState({});
    const [maintenancePlans, setMaintenancePlans] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Separate alerts into unresolved and resolved
    const unresolvedAlerts = alerts.filter((alert) => !alert.acknowledged);
    const resolvedAlerts = alerts.filter((alert) => alert.acknowledged);

    useEffect(() => {
      // Fetch maintenance plans for unresolved alerts
      const fetchMaintenancePlans = async () => {
        setLoading(true);
        try {
          const plans = {};
          for (const alert of unresolvedAlerts) {
            const response = await axios.get(
              `${API_BASE_URL}/maintenance/plan/${alert.id}`
            );
            plans[alert.id] = response.data;
          }
          setMaintenancePlans(plans);
        } catch (error) {
          console.error("Error fetching maintenance plans:", error);
        }
        setLoading(false);
      };

      fetchMaintenancePlans();
    }, [unresolvedAlerts]);

    const toggleExpand = (alertId) => {
      setExpandedAlerts((prev) => ({
        ...prev,
        [alertId]: !prev[alertId],
      }));
    };

    const navigateToAlerts = (alertId) => {
      navigate("/alerts", { state: { selectedAlertId: alertId } });
    };

    const handleViewDetails = (alert) => {
      setSelectedAlert(alert);
      setShowDetailsDialog(true);
    };

    return (
      <Box>
        {/* Unresolved Alerts Section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Unresolved Alerts
        </Typography>
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
                    direction={orderBy === "timestamp" ? order : "asc"}
                    onClick={() => handleSort("timestamp")}
                  >
                    Timestamp
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "device"}
                    direction={orderBy === "device" ? order : "asc"}
                    onClick={() => handleSort("device")}
                  >
                    Device
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "message"}
                    direction={orderBy === "message" ? order : "asc"}
                    onClick={() => handleSort("message")}
                  >
                    Message
                  </TableSortLabel>
                </TableCell>
                <TableCell>Maintenance Plan</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortAlerts(unresolvedAlerts).map((alert) => (
                <React.Fragment key={alert.id}>
                  <TableRow>
                    <TableCell>
                      <Chip
                        label={getSeverityLabel(alert.severity)}
                        color={
                          getSeverityNumber(alert.severity) >= 7
                            ? "error"
                            : "warning"
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(alert.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getDeviceName(alert.device_id, devices)}
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => toggleExpand(alert.id)}>
                        {expandedAlerts[alert.id] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Jump to Alerts">
                        <IconButton onClick={() => navigateToAlerts(alert.id)}>
                          <LaunchIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  {expandedAlerts[alert.id] && maintenancePlans[alert.id] && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ p: 2, bgcolor: "background.paper" }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Maintenance Plan
                          </Typography>
                          <List>
                            {maintenancePlans[alert.id].steps.map(
                              (step, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <CircleIcon sx={{ fontSize: 8 }} />
                                  </ListItemIcon>
                                  <ListItemText primary={step} />
                                </ListItem>
                              )
                            )}
                          </List>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            sx={{ mt: 2 }}
                          >
                            Preventative Measures
                          </Typography>
                          <List>
                            {maintenancePlans[
                              alert.id
                            ].preventative_measures.map((measure, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <CircleIcon sx={{ fontSize: 8 }} />
                                </ListItemIcon>
                                <ListItemText primary={measure} />
                              </ListItem>
                            ))}
                          </List>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              Estimated Time:{" "}
                              {maintenancePlans[alert.id].estimated_time} hours
                            </Typography>
                            <Typography variant="body2">
                              Required Tools:{" "}
                              {maintenancePlans[alert.id].required_tools.join(
                                ", "
                              )}
                            </Typography>
                            <Typography variant="body2">
                              Skill Level:{" "}
                              {maintenancePlans[alert.id].skill_level}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Resolved Alerts Section */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Resolved Alerts
        </Typography>
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
                    direction={orderBy === "timestamp" ? order : "asc"}
                    onClick={() => handleSort("timestamp")}
                  >
                    Timestamp
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "device"}
                    direction={orderBy === "device" ? order : "asc"}
                    onClick={() => handleSort("device")}
                  >
                    Device
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "message"}
                    direction={orderBy === "message" ? order : "asc"}
                    onClick={() => handleSort("message")}
                  >
                    Message
                  </TableSortLabel>
                </TableCell>
                <TableCell>Resolution Notes</TableCell>
                <TableCell>Resolved At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortAlerts(resolvedAlerts).map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Chip
                      label={getSeverityLabel(alert.severity)}
                      color={
                        getSeverityNumber(alert.severity) >= 7
                          ? "error"
                          : "warning"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(alert.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getDeviceName(alert.device_id, devices)}
                  </TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>
                    {alert.resolution_notes || "No notes provided"}
                  </TableCell>
                  <TableCell>
                    {alert.resolution_timestamp
                      ? new Date(alert.resolution_timestamp).toLocaleString()
                      : "Unknown"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(alert)}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Alert Details Dialog */}
        <Dialog
          open={showDetailsDialog}
          onClose={() => setShowDetailsDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedAlert && (
            <>
              <DialogTitle
                sx={{
                  bgcolor: "success.main",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <CheckCircleIcon />
                Resolved Alert Details
              </DialogTitle>
              <DialogContent sx={{ mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1" gutterBottom>
                    <strong>Device:</strong>{" "}
                    {getDeviceName(selectedAlert.device_id, devices)}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Alert Type:</strong>{" "}
                    {selectedAlert.alert_type || "warning"}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Message:</strong> {selectedAlert.message}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Created At:</strong>{" "}
                    {new Date(selectedAlert.timestamp).toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Resolution Details
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Resolution Notes:</strong>{" "}
                    {selectedAlert.resolution_notes || "No notes provided"}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Resolved At:</strong>{" "}
                    {selectedAlert.resolution_timestamp
                      ? new Date(
                          selectedAlert.resolution_timestamp
                        ).toLocaleString()
                      : "Unknown"}
                  </Typography>
                </Box>
                <Box
                  sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    onClick={() => setShowDetailsDialog(false)}
                    variant="contained"
                    color="primary"
                  >
                    Close
                  </Button>
                </Box>
              </DialogContent>
            </>
          )}
        </Dialog>
      </Box>
    );
  };

  const getSeverityNumber = (severity) => {
    if (typeof severity === "number") {
      return severity;
    }

    const severityMap = {
      critical: 9,
      high: 7,
      medium: 5,
      low: 3,
    };

    return severityMap[severity.toLowerCase()] || 5;
  };

  const getSeverityIcon = (severity) => {
    const severityNum = getSeverityNumber(severity);
    if (severityNum >= 7) {
      return <ErrorIcon color="error" fontSize="small" />;
    }
    if (severityNum >= 4) {
      return <WarningIcon color="warning" fontSize="small" />;
    }
    return <InfoIcon color="info" fontSize="small" />;
  };

  const getSeverityLabel = (severity) => {
    const severityNum = getSeverityNumber(severity);
    if (severityNum >= 7) return "Critical";
    if (severityNum >= 4) return "Warning";
    return "Info";
  };

  const renderAlerts = () => (
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
                direction={orderBy === "timestamp" ? order : "asc"}
                onClick={() => handleSort("timestamp")}
              >
                Timestamp
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "device"}
                direction={orderBy === "device" ? order : "asc"}
                onClick={() => handleSort("device")}
              >
                Device
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={orderBy === "message"}
                direction={orderBy === "message" ? order : "asc"}
                onClick={() => handleSort("message")}
              >
                Message
              </TableSortLabel>
            </TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortAlerts(alerts).map((alert) => {
            const severityNum = getSeverityNumber(alert.severity);
            const severityLabel = getSeverityLabel(alert.severity);
            const severityColor =
              severityNum >= 7
                ? "error"
                : severityNum >= 4
                ? "warning"
                : "info";

            return (
              <TableRow key={alert.id}>
                <TableCell>
                  <Chip
                    label={`${severityLabel}`}
                    color={severityColor}
                    size="small"
                    sx={{ fontWeight: "bold" }}
                  />
                </TableCell>
                <TableCell>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{getDeviceName(alert.device_id, devices)}</TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  <Chip
                    label={alert.acknowledged ? "RESOLVED" : "UNRESOLVED"}
                    color={alert.acknowledged ? "success" : "warning"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderPredictions = () => (
    <Box>
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
                  direction={orderBy === "timestamp" ? order : "asc"}
                  onClick={() => handleSort("timestamp")}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "device"}
                  direction={orderBy === "device" ? order : "asc"}
                  onClick={() => handleSort("device")}
                >
                  Device
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === "message"}
                  direction={orderBy === "message" ? order : "asc"}
                  onClick={() => handleSort("message")}
                >
                  Message
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Predicted Failure Date</TableCell>
              <TableCell>Days Remaining</TableCell>
              <TableCell>Causes</TableCell>
              <TableCell>Root Cause</TableCell>
              <TableCell>Resource Requirements</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortAlerts(alerts).map((alert) => {
              const severityNum = getSeverityNumber(alert.severity);
              const severityLabel = getSeverityLabel(alert.severity);
              const severityColor =
                severityNum >= 7
                  ? "error"
                  : severityNum >= 4
                  ? "warning"
                  : "info";

              const analysis = analysisData[alert.id];
              const isResolved = alert.acknowledged || alert.resolved;

              return (
                <TableRow
                  key={alert.id}
                  id={`alert-${alert.id}`}
                  sx={{
                    backgroundColor: isResolved
                      ? "rgba(0, 0, 0, 0.04)"
                      : `${severityColor}.lighter`,
                    opacity: isResolved ? 0.7 : 1,
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        label={`${severityLabel}`}
                        color={severityColor}
                        size="small"
                        sx={{ fontWeight: "bold" }}
                      />
                      {typeof alert.severity === "number" && (
                        <Typography variant="caption" color="textSecondary">
                          ({alert.severity})
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {new Date(alert.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>{alert.device_name || "Unknown Device"}</TableCell>
                  <TableCell>{alert.message || "No message"}</TableCell>
                  <TableCell>
                    <Chip
                      label={isResolved ? "RESOLVED" : "UNRESOLVED"}
                      color={isResolved ? "success" : "warning"}
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                  </TableCell>
                  <TableCell>
                    {analysis
                      ? new Date(
                          analysis.predicted_failure_date
                        ).toLocaleDateString()
                      : "Loading..."}
                  </TableCell>
                  <TableCell>
                    {analysis
                      ? `${analysis.days_remaining} days`
                      : "Loading..."}
                  </TableCell>
                  <TableCell>
                    {analysis ? (
                      <Box>
                        {analysis.causes.map((cause, index) => (
                          <Typography
                            key={index}
                            variant="body2"
                            sx={{ mb: 0.5 }}
                          >
                            • {cause}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      "Loading..."
                    )}
                  </TableCell>
                  <TableCell>
                    {analysis ? (
                      <Typography variant="body2">
                        {analysis.root_cause}
                      </Typography>
                    ) : (
                      "Loading..."
                    )}
                  </TableCell>
                  <TableCell>
                    {analysis && analysis.resource_requirements ? (
                      <Box>
                        {Object.entries(analysis.resource_requirements).map(
                          ([resource, count]) => (
                            <Typography
                              key={resource}
                              variant="body2"
                              sx={{ mb: 0.5 }}
                            >
                              • {count} {resource.replace(/_/g, " ")}
                            </Typography>
                          )
                        )}
                      </Box>
                    ) : (
                      "Loading..."
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {alerts.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ py: 2 }}
                  >
                    No predictions to display
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const handleResolveAlert = async (alertId) => {
    try {
      // Update the alert status locally first for immediate feedback
      setAlerts(
        alerts.map((alert) =>
          alert.id === alertId
            ? { ...alert, acknowledged: true, resolved: true }
            : alert
        )
      );

      // Close the details dialog if it's open
      setShowDetailsDialog(false);

      // Update statistics
      updateStatistics(predictedFailures, alerts);

      setError(null);
    } catch (error) {
      console.error("Error resolving alert:", error);
      setError("Failed to resolve alert. Please try again.");
    }
  };

  // Add sorting function
  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Add sort function for alerts
  const sortAlerts = (alertsToSort) => {
    if (!alertsToSort || alertsToSort.length === 0) return [];

    return [...alertsToSort].sort((a, b) => {
      const isAsc = order === "asc";

      switch (orderBy) {
        case "severity":
          const severityA =
            typeof a.severity === "number"
              ? a.severity
              : getSeverityNumber(a.severity);
          const severityB =
            typeof b.severity === "number"
              ? b.severity
              : getSeverityNumber(b.severity);
          return isAsc ? severityA - severityB : severityB - severityA;

        case "timestamp":
          return isAsc
            ? new Date(a.timestamp) - new Date(b.timestamp)
            : new Date(b.timestamp) - new Date(a.timestamp);

        case "device":
          const deviceA =
            devices.find((d) => d.id === a.device_id)?.name || "Unknown Device";
          const deviceB =
            devices.find((d) => d.id === b.device_id)?.name || "Unknown Device";
          return isAsc
            ? deviceA.localeCompare(deviceB)
            : deviceB.localeCompare(deviceA);

        case "message":
          return isAsc
            ? a.message.localeCompare(b.message)
            : b.message.localeCompare(a.message);

        default:
          return 0;
      }
    });
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

      {/* Main Content Tabs - Reordered to show alerts first */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Alerts & Issues" />
          <Tab label="Predictions" />
          <Tab label="Maintenance" />
          <Tab label="Overview" />
        </Tabs>
      </Box>

      {/* Tab Content - Updated order to match new tab order */}
      {selectedTab === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Active Alerts and Issues
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, mb: 3 }}>{renderAlerts()}</Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Environmental Issues</Typography>
                  <Button
                    variant="outlined"
                    startIcon={<NotificationsIcon />}
                    endIcon={<LaunchIcon />}
                    onClick={() =>
                      navigate("/alerts", {
                        state: { filter: "environmental" },
                      })
                    }
                  >
                    View All Environmental Alerts
                  </Button>
                </Box>
                {renderEnvironmentalIssues()}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      )}

      {selectedTab === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Predictions
          </Typography>
          {renderPredictions()}
        </Box>
      )}

      {selectedTab === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            Maintenance
          </Typography>
          <MaintenanceTab />
        </Box>
      )}

      {selectedTab === 3 && (
        <>
          {renderStatisticsCards()}
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              {renderTrendAnalysis()}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderDeviceHealth()}
            </Grid>
          </Grid>
        </>
      )}

      {/* Alert Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedFailure && (
          <>
            <DialogContent>
              <Typography variant="h6" gutterBottom>
                Alert Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Device Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Device:</strong> {selectedFailure.device_name}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Location:</strong> {selectedFailure.location}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          <strong>Component:</strong>{" "}
                          {selectedFailure.component}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Status:</strong> {selectedFailure.status}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Alert Information
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Message:</strong>{" "}
                      {selectedFailure.message ||
                        selectedFailure.failure_reason}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>Severity:</strong>{" "}
                      <Chip
                        label={selectedFailure.severity.toUpperCase()}
                        color={
                          selectedFailure.severity === "critical"
                            ? "error"
                            : selectedFailure.severity === "warning"
                            ? "warning"
                            : "info"
                        }
                        size="small"
                      />
                    </Typography>
                    <Typography variant="body2">
                      <strong>Timestamp:</strong>{" "}
                      {new Date(
                        selectedFailure.timestamp ||
                          selectedFailure.prediction_time
                      ).toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                {selectedFailure.recommended_actions && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Recommended Actions
                      </Typography>
                      <List dense>
                        {selectedFailure.recommended_actions.map(
                          (action, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <BuildIcon color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={action.title}
                                secondary={action.description}
                              />
                            </ListItem>
                          )
                        )}
                      </List>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
              {!selectedFailure.status ||
              selectedFailure.status === "unresolved" ? (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleResolveAlert(selectedFailure.id)}
                >
                  Mark as Resolved
                </Button>
              ) : null}
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Dashboard;

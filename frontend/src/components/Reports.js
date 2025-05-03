import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deviceMetrics, setDeviceMetrics] = useState([]);
  const [alertAnalysis, setAlertAnalysis] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("temperature");
  const [timeRange, setTimeRange] = useState("24h");
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, alertsRes] = await Promise.all([
        axios.get("http://localhost:8000/reports/device-metrics"),
        axios.get("http://localhost:8000/reports/alert-analysis"),
      ]);

      setDeviceMetrics(metricsRes.data);
      setAlertAnalysis(alertsRes.data);
      setLastUpdate(new Date());
      setError(null);
    } catch (error) {
      setError("Failed to fetch report data");
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getDeviceStatusDistribution = () => {
    const statusCount = deviceMetrics.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {});

    const total = deviceMetrics.length;
    return [
      {
        name: "Operational",
        value: ((statusCount.operational || 0) / total) * 100,
        color: "#4caf50",
      },
      {
        name: "Warning",
        value: ((statusCount.warning || 0) / total) * 100,
        color: "#ff9800",
      },
      {
        name: "Critical",
        value: ((statusCount.critical || 0) / total) * 100,
        color: "#f44336",
      },
    ];
  };

  const getAlertTrends = () => {
    if (!alertAnalysis) return [];
    return alertAnalysis.trends;
  };

  const getFilteredSensorData = () => {
    if (!deviceMetrics.length) return [];

    const device = deviceMetrics.find(d => d.device_id === selectedDevice);
    if (!device || !device.sensor_metrics) return [];

    const metrics = device.sensor_metrics[selectedMetric];
    if (!metrics) return [];

    return [{
      name: "Current",
      value: metrics.current,
      average: metrics.average,
      min: metrics.min,
      max: metrics.max,
      trend: metrics.trend
    }];
  };

  const exportToPDF = async () => {
    const input = document.getElementById("reports-container");
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 30;

    pdf.setFontSize(18);
    pdf.text("Predictive Maintenance Report", 20, 20);
    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save("maintenance-report.pdf");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
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
    <Box p={3} id="reports-container">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Maintenance Reports</Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchData} sx={{ mr: 2 }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={exportToPDF}
          >
            Export as PDF
          </Button>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: "block" }}>
        Last Updated: {lastUpdate.toLocaleString()}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Device</InputLabel>
            <Select
              value={selectedDevice}
              label="Device"
              onChange={(e) => setSelectedDevice(e.target.value)}
            >
              <MenuItem value="all">All Devices</MenuItem>
              {deviceMetrics.map((device) => (
                <MenuItem key={device.device_id} value={device.device_id}>
                  {device.device_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              label="Metric"
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <MenuItem value="temperature">Temperature</MenuItem>
              <MenuItem value="humidity">Humidity</MenuItem>
              <MenuItem value="vibration">Vibration</MenuItem>
              <MenuItem value="power">Power</MenuItem>
              <MenuItem value="voltage">Voltage</MenuItem>
              <MenuItem value="current">Current</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Alert Summary */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alert Summary
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: "#ffebee" }}>
                  <CardContent>
                    <Typography variant="h6" color="error">
                      Critical Alerts
                    </Typography>
                    <Typography variant="h4">
                      {alertAnalysis?.summary.critical_alerts || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: "#fff3e0" }}>
                  <CardContent>
                    <Typography variant="h6" color="warning.dark">
                      Warning Alerts
                    </Typography>
                    <Typography variant="h4">
                      {alertAnalysis?.summary.warning_alerts || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: "#e8f5e9" }}>
                  <CardContent>
                    <Typography variant="h6" color="success.dark">
                      Resolved Alerts
                    </Typography>
                    <Typography variant="h4">
                      {alertAnalysis?.summary.resolved_alerts || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6}>
                <Card sx={{ bgcolor: "#e3f2fd" }}>
                  <CardContent>
                    <Typography variant="h6" color="info.dark">
                      Resolution Rate
                    </Typography>
                    <Typography variant="h4">
                      {alertAnalysis?.summary.resolution_rate.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Device Health Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Health Distribution
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getDeviceStatusDistribution()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                  >
                    {getDeviceStatusDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Alert Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Alert Trends (Last 7 Days)
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAlertTrends()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="critical" fill="#f44336" name="Critical Alerts" />
                  <Bar dataKey="warning" fill="#ff9800" name="Warning Alerts" />
                  <Bar dataKey="resolved" fill="#4caf50" name="Resolved Alerts" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Device Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Device Metrics
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Device</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Health Score</TableCell>
                    <TableCell>Alerts</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deviceMetrics.map((device) => (
                    <TableRow key={device.device_id}>
                      <TableCell>{device.device_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={device.status}
                          color={
                            device.status === "operational"
                              ? "success"
                              : device.status === "warning"
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" sx={{ mr: 1 }}>
                            {device.health_score}%
                          </Typography>
                          {device.health_score >= 80 ? (
                            <TrendingUpIcon color="success" />
                          ) : device.health_score >= 50 ? (
                            <TrendingDownIcon color="warning" />
                          ) : (
                            <TrendingDownIcon color="error" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{device.alert_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;

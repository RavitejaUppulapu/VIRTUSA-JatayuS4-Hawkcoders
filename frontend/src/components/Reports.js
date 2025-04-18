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
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Download as DownloadIcon } from "@mui/icons-material";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("temperature");
  const [timeRange, setTimeRange] = useState("24h");
  const [sensorData, setSensorData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [devicesRes, sensorRes, alertsRes] = await Promise.all([
          axios.get("http://localhost:8000/devices"),
          axios.get("http://localhost:8000/sensor-data"),
          axios.get("http://localhost:8000/alerts"),
        ]);

        setDevices(devicesRes.data);
        setSensorData(sensorRes.data);
        setAlerts(alertsRes.data);

        // Process maintenance history from alerts
        const history = alertsRes.data
          .filter((alert) => alert.alert_type === "PREDICTIVE_MAINTENANCE")
          .map((alert) => ({
            id: alert.id,
            device:
              devicesRes.data.find((d) => d.id === alert.device_id)?.name ||
              alert.device_id,
            date: new Date(alert.timestamp).toLocaleDateString(),
            type: "Predictive",
            cost: alert.details?.cost || 150,
            status: alert.acknowledged ? "Completed" : "Pending",
            severity: alert.severity,
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        setMaintenanceHistory(history);
        setError(null);
      } catch (error) {
        setError("Failed to fetch report data");
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getDeviceStatusDistribution = () => {
    const statusCount = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {});

    const total = devices.length;
    return [
      {
        name: "healthy",
        value: ((statusCount.healthy || 0) / total) * 100,
        color: "#00C49F",
      },
      {
        name: "warning",
        value: ((statusCount.warning || 0) / total) * 100,
        color: "#FFBB28",
      },
    ];
  };

  const getMaintenanceCostDistribution = () => {
    return [
      { name: "Preventive", value: 250, color: "#00C49F" },
      { name: "Corrective", value: 500, color: "#FFBB28" },
      { name: "Predictive", value: 150, color: "#FF8042" },
    ];
  };

  const getAlertTrends = () => {
    const last7Days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      return date.toISOString().split("T")[0];
    });

    return last7Days.map((date) => {
      const dayAlerts = alerts.filter((alert) =>
        alert.timestamp.startsWith(date)
      );

      return {
        date: new Date(date).toLocaleDateString(),
        "Critical Alerts": dayAlerts.filter((a) => a.severity > 7).length,
        "Warning Alerts": dayAlerts.filter(
          (a) => a.severity > 4 && a.severity <= 7
        ).length,
        "Info Alerts": dayAlerts.filter((a) => a.severity <= 4).length,
      };
    });
  };

  const getFilteredSensorData = () => {
    if (!sensorData || Object.keys(sensorData).length === 0) {
      return [];
    }

    let filteredData = [];
    const now = new Date();
    const timeRangeHours =
      timeRange === "24h" ? 24 : timeRange === "7d" ? 168 : 720;

    if (selectedDevice === "all") {
      // Combine data from all devices
      Object.values(sensorData).forEach((deviceData) => {
        deviceData.forEach((reading) => {
          const readingTime = new Date(reading.timestamp);
          const hoursDiff = (now - readingTime) / (1000 * 60 * 60);

          if (hoursDiff <= timeRangeHours) {
            filteredData.push({
              timestamp: reading.timestamp,
              [selectedMetric]: reading[selectedMetric],
            });
          }
        });
      });
    } else {
      // Get data for selected device
      const deviceData = sensorData[selectedDevice] || [];
      filteredData = deviceData
        .filter((reading) => {
          const readingTime = new Date(reading.timestamp);
          const hoursDiff = (now - readingTime) / (1000 * 60 * 60);
          return hoursDiff <= timeRangeHours;
        })
        .map((reading) => ({
          timestamp: reading.timestamp,
          [selectedMetric]: reading[selectedMetric],
        }));
    }

    // Sort by timestamp
    filteredData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return filteredData;
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
    pdf.addImage(
      imgData,
      "PNG",
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );
    pdf.save("maintenance-report.pdf");
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
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
    <Box p={3} id="reports-container">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4">Maintenance Reports</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={exportToPDF}
        >
          Export as PDF
        </Button>
      </Box>

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
              {devices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.name}
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
        {/* Temperature Trends */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}{" "}
              Trends
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getFilteredSensorData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="timestamp"
                    tickFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleTimeString()
                    }
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(timestamp) =>
                      new Date(timestamp).toLocaleString()
                    }
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#8884d8"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Infrastructure Health Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Infrastructure Health Distribution
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Alert Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alert Trends (Last 7 Days)
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getAlertTrends()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Critical Alerts" fill="#ff4444" />
                  <Bar dataKey="Warning Alerts" fill="#ffbb33" />
                  <Bar dataKey="Info Alerts" fill="#00C851" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Maintenance Cost Distribution */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Maintenance Cost Distribution
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getMaintenanceCostDistribution()}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name} $${value}`}
                  >
                    {getMaintenanceCostDistribution().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Maintenance History */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Maintenance History
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Cost ($)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {maintenanceHistory.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.device}</TableCell>
                      <TableCell>{record.type}</TableCell>
                      <TableCell>
                        <Typography
                          component="span"
                          sx={{
                            color:
                              record.status === "Completed"
                                ? "success.main"
                                : "warning.main",
                            fontWeight: "medium",
                          }}
                        >
                          {record.status}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">${record.cost}</TableCell>
                    </TableRow>
                  ))}
                  {maintenanceHistory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No maintenance history available
                      </TableCell>
                    </TableRow>
                  )}
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

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
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
import axios from "axios";

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sensorData, setSensorData] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [selectedMetric, setSelectedMetric] = useState("temperature");
  const [timeRange, setTimeRange] = useState("24h");
  const [maintenanceHistory, setMaintenanceHistory] = useState([
    {
      id: 1,
      device: "ATM_001",
      date: "2024-03-15",
      type: "Preventive",
      cost: 250,
    },
    {
      id: 2,
      device: "UPS_001",
      date: "2024-03-14",
      type: "Corrective",
      cost: 500,
    },
    {
      id: 3,
      device: "AC_001",
      date: "2024-03-13",
      type: "Predictive",
      cost: 150,
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sensorResponse, devicesResponse, alertsResponse] =
          await Promise.all([
            axios.get("http://localhost:8000/sensor-data"),
            axios.get("http://localhost:8000/devices"),
            axios.get("http://localhost:8000/alerts"),
          ]);
        setSensorData(sensorResponse.data);
        setDevices(devicesResponse.data);
        setAlerts(alertsResponse.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch report data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const filterData = () => {
    let filtered = [...sensorData];
    if (selectedDevice !== "all") {
      filtered = filtered.filter((d) => d.device_id === selectedDevice);
    }
    return filtered;
  };

  const calculateStats = () => {
    const data = filterData();
    const stats = {
      [selectedMetric]: {
        avg: 0,
        max: 0,
        min: Infinity,
        trend: "stable",
      },
    };

    data.forEach((d, index) => {
      stats[selectedMetric].avg += d[selectedMetric];
      stats[selectedMetric].max = Math.max(
        stats[selectedMetric].max,
        d[selectedMetric]
      );
      stats[selectedMetric].min = Math.min(
        stats[selectedMetric].min,
        d[selectedMetric]
      );

      if (index > 0) {
        const diff = d[selectedMetric] - data[index - 1][selectedMetric];
        if (Math.abs(diff) > 5) {
          stats[selectedMetric].trend = diff > 0 ? "increasing" : "decreasing";
        }
      }
    });

    stats[selectedMetric].avg /= data.length || 1;
    return stats;
  };

  const getDeviceStatusDistribution = () => {
    const distribution = devices.reduce((acc, device) => {
      acc[device.status] = (acc[device.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  };

  const getMaintenanceCostByType = () => {
    const costByType = maintenanceHistory.reduce((acc, maintenance) => {
      acc[maintenance.type] = (acc[maintenance.type] || 0) + maintenance.cost;
      return acc;
    }, {});

    return Object.entries(costByType).map(([type, cost]) => ({
      name: type,
      value: cost,
    }));
  };

  const getAlertTrends = () => {
    const last7Days = [...Array(7)].map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split("T")[0];
    });

    return last7Days
      .map((date) => ({
        date,
        critical: alerts.filter(
          (a) => a.severity === "critical" && a.timestamp.startsWith(date)
        ).length,
        warning: alerts.filter(
          (a) => a.severity === "warning" && a.timestamp.startsWith(date)
        ).length,
      }))
      .reverse();
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

  const stats = calculateStats();
  const COLORS = ["#00C49F", "#FFBB28", "#FF8042"];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Banking Infrastructure Analytics
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
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
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {selectedMetric.charAt(0).toUpperCase() +
                  selectedMetric.slice(1)}{" "}
                Trends
              </Typography>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={filterData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#8884d8"
                    name={
                      selectedMetric.charAt(0).toUpperCase() +
                      selectedMetric.slice(1)
                    }
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Infrastructure Health Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getDeviceStatusDistribution()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {getDeviceStatusDistribution().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Alert Trends (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getAlertTrends()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="critical"
                    fill="#ff4444"
                    name="Critical Alerts"
                  />
                  <Bar dataKey="warning" fill="#ffbb33" name="Warning Alerts" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Maintenance Cost Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getMaintenanceCostByType()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: $${value}`}
                  >
                    {getMaintenanceCostByType().map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Maintenance History
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Device</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Cost</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceHistory.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.device}</TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.type}</TableCell>
                        <TableCell>${record.cost}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Metrics
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle1">Average</Typography>
                  <Typography variant="h4">
                    {stats[selectedMetric].avg.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Trend: {stats[selectedMetric].trend}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle1">Maximum</Typography>
                  <Typography variant="h4">
                    {stats[selectedMetric].max.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle1">Minimum</Typography>
                  <Typography variant="h4">
                    {stats[selectedMetric].min.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="subtitle1">Alert Count (24h)</Typography>
                  <Typography variant="h4">
                    {
                      alerts.filter((a) => {
                        const alertTime = new Date(a.timestamp);
                        const now = new Date();
                        return now - alertTime < 24 * 60 * 60 * 1000;
                      }).length
                    }
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Reports;

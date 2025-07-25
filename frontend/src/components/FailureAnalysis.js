import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stack,
} from "@mui/material";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Build as BuildIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import axios from "axios";

const FailureAnalysis = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [failures, setFailures] = useState([]);
  const [stats, setStats] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [failuresRes, statsRes, timelineRes] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/failures?type=${
            tabValue === 0 ? "hardware" : "software"
          }`
        ),
        axios.get(`${API_BASE_URL}/failure-stats`),
        axios.get(`${API_BASE_URL}/failure-timeline`),
      ]);

      setFailures(failuresRes.data);
      setStats(statsRes.data);
      setTimeline(timelineRes.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching failure data:", err);
      setError(
        "Failed to fetch failure analysis data. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  }, [tabValue, API_BASE_URL]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [tabValue, fetchData]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#d32f2f";
      case "high":
        return "#f57c00";
      case "medium":
        return "#ffa000";
      case "low":
        return "#2e7d32";
      default:
        return "#757575";
    }
  };

  const renderPieChart = (data) => {
    const chartData = [
      { name: "Critical", value: data.critical_failures, color: "#d32f2f" },
      { name: "Warning", value: data.warning_failures, color: "#f57c00" },
      { name: "Resolved", value: data.resolved_failures, color: "#2e7d32" },
    ];

    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderComponentBarChart = (data) => {
    if (!data || !data.component_distribution) {
      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height={300}
        >
          <Typography color="textSecondary">
            No component data available
          </Typography>
        </Box>
      );
    }

    const chartData = Object.entries(data.component_distribution).map(
      ([name, value]) => ({
        name,
        value,
      })
    );

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="value" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderTimeline = (failures) => (
    <List>
      {failures.map((failure, index) => (
        <ListItem
          key={index}
          sx={{
            position: "relative",
            "&:not(:last-child)": {
              "&::after": {
                content: '""',
                position: "absolute",
                left: "24px",
                top: "100%",
                height: "20px",
                width: "2px",
                bgcolor: "divider",
              },
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: "48px" }}>
            <Avatar
              sx={{
                bgcolor: getSeverityColor(failure.severity),
                width: 32,
                height: 32,
              }}
            >
              {failure.severity === "critical" ? (
                <ErrorIcon />
              ) : failure.severity === "high" ? (
                <WarningIcon />
              ) : (
                <CheckCircleIcon />
              )}
            </Avatar>
          </ListItemIcon>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle1">{failure.device_id}</Typography>
                <Chip
                  label={failure.severity}
                  size="small"
                  sx={{
                    bgcolor: getSeverityColor(failure.severity),
                    color: "white",
                  }}
                />
              </Stack>
            }
            secondary={
              <>
                <Typography variant="body2" color="text.secondary">
                  {new Date(failure.timestamp).toLocaleString()}
                </Typography>
                <Typography variant="body2">{failure.description}</Typography>
                <Stack direction="row" spacing={1} mt={1}>
                  <Chip
                    icon={<BuildIcon />}
                    label={failure.component}
                    size="small"
                  />
                  {failure.technician && (
                    <Chip
                      icon={<PersonIcon />}
                      label={failure.technician}
                      size="small"
                    />
                  )}
                  {failure.resolution_time && (
                    <Chip
                      icon={<ScheduleIcon />}
                      label={`${failure.resolution_time.toFixed(2)}h`}
                      size="small"
                    />
                  )}
                </Stack>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );

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
      <Box m={2}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box m={2}>
        <Alert severity="info">No failure analysis data available.</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Failure Analysis
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Hardware Failures" />
        <Tab label="Software Failures" />
      </Tabs>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Critical Failures</Typography>
              </Box>
              <Typography variant="h4">{stats.critical_failures}</Typography>
              <Typography variant="body2" color="textSecondary">
                Out of {stats.total_failures} total failures
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Warning Level</Typography>
              </Box>
              <Typography variant="h4">{stats.warning_failures}</Typography>
              <Typography variant="body2" color="textSecondary">
                Require attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Resolved</Typography>
              </Box>
              <Typography variant="h4">{stats.resolved_failures}</Typography>
              <Typography variant="body2" color="textSecondary">
                Successfully addressed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={1}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Avg Resolution Time</Typography>
              </Box>
              <Typography variant="h4">
                {stats.avg_resolution_time.toFixed(2)}h
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Per failure
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Statistics Cards */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {tabValue === 0 ? "Hardware" : "Software"} Failure Statistics
            </Typography>
            {renderPieChart(stats)}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Total Incidents:{" "}
                {tabValue === 0
                  ? stats.hardware_failures
                  : stats.software_failures}
              </Typography>
              <Typography variant="body2">
                Resolution Rate:{" "}
                {Math.round(
                  (stats.resolved_failures / stats.total_failures) * 100
                )}
                %
              </Typography>
              <Typography variant="body2">
                Average Resolution Time: {stats.avg_resolution_time.toFixed(2)}{" "}
                hours
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Component Distribution */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Component Distribution
            </Typography>
            {renderComponentBarChart(stats)}
          </Paper>
        </Grid>

        {/* Failure Timeline */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent {tabValue === 0 ? "Hardware" : "Software"} Failures
            </Typography>
            {failures.length > 0 ? (
              renderTimeline(failures)
            ) : (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight={200}
              >
                <Typography color="textSecondary">
                  No failures reported
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Failure Timeline Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Failure Timeline
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="critical" name="Critical" fill="#f44336" />
                    <Bar dataKey="total" name="Total" fill="#2196f3" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Component Failures */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Component Failures
              </Typography>
              <List>
                {Object.entries(stats.component_distribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([component, count]) => (
                    <ListItem key={component}>
                      <ListItemIcon>
                        <BuildIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={component}
                        secondary={`${count} failures`}
                      />
                      <Chip
                        label={`${Math.round(
                          (count / stats.total_failures) * 100
                        )}%`}
                        color={
                          count > stats.total_failures / 3 ? "error" : "default"
                        }
                        size="small"
                      />
                    </ListItem>
                  ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FailureAnalysis;

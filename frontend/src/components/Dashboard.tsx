import React, { useEffect, useState } from "react";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  DeviceHub as DeviceIcon,
  Warning as AlertIcon,
  Analytics as AnalyticsIcon,
  Assessment as ReportIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { dashboardService } from "../services/DashboardService";

const drawerWidth = 240;

const Dashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<any>({});
  const [alerts, setAlerts] = useState<any[]>([]);
  const [sensorData, setSensorData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusData, alertsData] = await Promise.all([
          dashboardService.getDeviceStatus(),
          dashboardService.getEnvironmentalAlerts(),
        ]);
        setDeviceStatus(statusData);
        setAlerts(alertsData);

        // Mock sensor data for the graph
        setSensorData(
          Array.from({ length: 24 }, (_, i) => ({
            time: format(new Date(Date.now() - i * 3600000), "HH:mm"),
            value: 25 + Math.random() * 5,
          })).reverse()
        );
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return "#ff4444";
    if (severity >= 5) return "#ffbb33";
    return "#00C851";
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Menu
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        <ListItem button selected>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <DeviceIcon />
          </ListItemIcon>
          <ListItemText primary="Device Status" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <AlertIcon />
          </ListItemIcon>
          <ListItemText primary="Alerts" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText primary="Failure Analysis" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <ReportIcon />
          </ListItemIcon>
          <ListItemText primary="Reports" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <HelpIcon />
          </ListItemIcon>
          <ListItemText primary="Why Choose Us" />
        </ListItem>
        <ListItem button>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: "#1976d2",
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Predictive Maintenance System
          </Typography>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Typography variant="h5" sx={{ mb: 3 }}>
          System Overview
        </Typography>

        {/* Device Status Section */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Device Status
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Server Room AC</Typography>
              <Typography color="textSecondary">Status: operational</Typography>
              <Typography color="textSecondary">
                Location: Server Room
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Main Power Unit</Typography>
              <Typography color="textSecondary">Status: operational</Typography>
              <Typography color="textSecondary">
                Location: Electrical Room
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Network Switch</Typography>
              <Typography color="textSecondary">Status: operational</Typography>
              <Typography color="textSecondary">
                Location: Server Room
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Backup Generator</Typography>
              <Typography color="textSecondary">Status: standby</Typography>
              <Typography color="textSecondary">Location: Outside</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1">Storage Array</Typography>
              <Typography color="textSecondary">Status: operational</Typography>
              <Typography color="textSecondary">
                Location: Server Room
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Active Alerts Section */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Active Alerts
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            {
              device_id: "device_3",
              description: "Abnormal behavior detected in network interface",
              severity: 5,
            },
            {
              device_id: "device_1",
              description: "Abnormal behavior detected in temperature sensor",
              severity: 8,
            },
            {
              device_id: "device_2",
              description: "Abnormal behavior detected in power supply",
              severity: 10,
            },
            {
              device_id: "device_1",
              description: "Abnormal behavior detected in power supply",
              severity: 2,
            },
            {
              device_id: "device_1",
              description: "Abnormal behavior detected in cooling system",
              severity: 4,
            },
          ].map((alert, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Paper
                sx={{
                  p: 2,
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`,
                  bgcolor: `${getSeverityColor(alert.severity)}10`,
                }}
              >
                <Typography variant="subtitle2">
                  Device: {alert.device_id}
                </Typography>
                <Typography>{alert.description}</Typography>
                <Typography variant="caption">
                  Severity: {alert.severity}/10
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Sensor Readings Section */}
        <Typography variant="h6" sx={{ mb: 2 }}>
          Sensor Readings
        </Typography>
        <Paper sx={{ p: 2, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis domain={[20, 40]} />
              <RechartsTooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ff4444"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;

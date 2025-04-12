import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  ListItem,
  ListItemIcon,
  ListItemText,
  CssBaseline,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Warning as AlertIcon,
  DevicesOther as DeviceIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import Dashboard from "./components/Dashboard";
import Alerts from "./components/Alerts";
import DeviceStatus from "./components/DeviceStatus";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import "./App.css";

const drawerWidth = 240;

function App() {
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Device Status", icon: <DeviceIcon />, path: "/device-status" },
    { text: "Alerts", icon: <AlertIcon />, path: "/alerts" },
    { text: "Reports", icon: <ReportIcon />, path: "/reports" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  return (
    <Router>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Predictive Maintenance System
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
            },
          }}
          variant="permanent"
          anchor="left"
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div">
              Menu
            </Typography>
          </Toolbar>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem button key={item.text} component={Link} to={item.path}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            p: 3,
            mt: 8,
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/device-status" element={<DeviceStatus />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;

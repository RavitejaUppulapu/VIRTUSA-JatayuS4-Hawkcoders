/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  IconButton,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Warning as AlertIcon,
  DevicesOther as DeviceIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  BugReport as FailureIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import Navigation from "./Navigation";

const drawerWidth = 240;

const Layout = ({ children }) => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
    { text: "Device Status", icon: <DeviceIcon />, path: "/device-status" },
    { text: "Alerts", icon: <AlertIcon />, path: "/alerts" },
    // {
    //   text: "Failure Analysis",
    //   icon: <FailureIcon />,
    //   path: "/failure-analysis",
    // },
    { text: "Reports", icon: <ReportIcon />, path: "/reports" },
    { text: "Why Choose Us", icon: <InfoIcon />, path: "/why-choose-us" },
    { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ width: "100%", ml: 0, bgcolor: "primary.main" }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
          Predictive maintenance of banking infrastructure
          </Typography>
        </Toolbar>
      </AppBar>
      {/* Hamburger Navigation Drawer */}
      <Navigation open={drawerOpen} setOpen={setDrawerOpen} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: "background.default",
          p: 3,
          mt: 5,
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;


import React from "react";
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

const drawerWidth = 240;

const Layout = ({ children }) => {
  const location = useLocation();

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
      <AppBar
        position="fixed"
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          bgcolor: "primary.main",
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
            bgcolor: "background.paper",
            overflowX: 'hidden',
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
            <ListItem
              button
              key={item.text}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                my: 0.5,
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: '#fff',
                  '& .MuiListItemIcon-root': {
                    color: '#fff',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#fff',
                    fontWeight: 600,
                  },
                },
                '&:hover': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'text.primary',
                  },
                  '& .MuiListItemText-primary': {
                    color: 'text.primary',
                  },
                },
                transition: 'background 0.2s, color 0.2s',
                minHeight: 48,
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? '#fff'
                      : 'inherit',
                  minWidth: 36,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} sx={{ fontWeight: 500 }} />
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
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;


import React from "react";
import { Link } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Warning as WarningIcon,
  Settings as SettingsIcon,
  Devices as DevicesIcon,
  ChevronLeft as ChevronLeftIcon,
} from "@mui/icons-material";

const drawerWidth = 240;

const Navigation = () => {
  return (
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
      <Box sx={{ display: "flex", alignItems: "center", p: 2 }}>
        <Typography variant="h6" noWrap component="div">
          Maintenance System
        </Typography>
        <IconButton>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        <ListItem button component={Link} to="/">
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button component={Link} to="/alerts">
          <ListItemIcon>
            <WarningIcon />
          </ListItemIcon>
          <ListItemText primary="Alerts" />
        </ListItem>
        <ListItem button component={Link} to="/device/status">
          <ListItemIcon>
            <DevicesIcon />
          </ListItemIcon>
          <ListItemText primary="Device Status" />
        </ListItem>
        <ListItem button component={Link} to="/settings">
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Navigation;

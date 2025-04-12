import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import axios from "axios";

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get("http://localhost:8000/alerts");
        setAlerts(response.data);
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityIcon = (severity) => {
    if (severity > 7) return <ErrorIcon color="error" />;
    if (severity > 4) return <WarningIcon color="warning" />;
    return <CheckCircleIcon color="success" />;
  };

  const getSeverityLabel = (severity) => {
    if (severity > 7) return "Critical";
    if (severity > 4) return "Warning";
    return "Info";
  };

  const getSeverityColor = (severity) => {
    if (severity > 7) return "error";
    if (severity > 4) return "warning";
    return "info";
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Alerts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Timestamp</TableCell>
              <TableCell>Device ID</TableCell>
              <TableCell>Alert Type</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {alerts.map((alert) => (
              <TableRow key={alert.id}>
                <TableCell>
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>{alert.device_id}</TableCell>
                <TableCell>{alert.alert_type}</TableCell>
                <TableCell>
                  <Chip
                    icon={getSeverityIcon(alert.severity)}
                    label={getSeverityLabel(alert.severity)}
                    color={getSeverityColor(alert.severity)}
                  />
                </TableCell>
                <TableCell>{alert.message}</TableCell>
                <TableCell>
                  <Tooltip title={JSON.stringify(alert.details, null, 2)}>
                    <IconButton>
                      <ErrorIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Alerts;

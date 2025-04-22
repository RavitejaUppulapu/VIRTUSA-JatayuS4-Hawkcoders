import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircleIcon,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  VisibilityOutlined,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

const MaintenanceTab = ({ alerts, devices }) => {
  const [expandedAlerts, setExpandedAlerts] = useState({});
  const [maintenancePlans, setMaintenancePlans] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Separate alerts into unresolved and resolved
  const unresolvedAlerts = alerts.filter((alert) => !alert.acknowledged);
  const resolvedAlerts = alerts.filter((alert) => alert.acknowledged);

  useEffect(() => {
    // Fetch maintenance plans for unresolved alerts
    const fetchMaintenancePlans = async () => {
      setLoading(true);
      try {
        const plans = {};
        for (const alert of unresolvedAlerts) {
          const response = await fetch(`/api/maintenance/plan/${alert.id}`);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch maintenance plan: ${response.statusText}`
            );
          }
          const data = await response.json();
          plans[alert.id] = data;
        }
        setMaintenancePlans(plans);
      } catch (err) {
        console.error("Error fetching maintenance plans:", err);
        setError(err.message);
      }
      setLoading(false);
    };

    fetchMaintenancePlans();
  }, [unresolvedAlerts]);

  const toggleExpand = (alertId) => {
    setExpandedAlerts((prev) => ({
      ...prev,
      [alertId]: !prev[alertId],
    }));
  };

  const getResolutionNotes = (alert) => {
    return (
      alert.resolution_notes || alert.resolutionNotes || "No notes provided"
    );
  };

  const getResolutionTimestamp = (alert) => {
    const timestamp = alert.resolution_timestamp || alert.resolutionTimestamp;
    return timestamp ? new Date(timestamp).toLocaleString() : "Unknown";
  };

  const getResolvedBy = (alert) => {
    return alert.resolved_by || alert.resolvedBy || "Unknown";
  };

  const getSeverityLabel = (severity) => {
    if (typeof severity === "number") {
      if (severity >= 7) return "Critical";
      if (severity >= 4) return "Warning";
      return "Info";
    }
    return severity?.charAt(0).toUpperCase() + severity?.slice(1) || "Unknown";
  };

  const getSeverityColor = (severity) => {
    if (typeof severity === "number") {
      return severity >= 7 ? "error" : severity >= 4 ? "warning" : "info";
    }
    const severityMap = {
      critical: "error",
      high: "error",
      warning: "warning",
      medium: "warning",
      low: "info",
    };
    return severityMap[severity?.toLowerCase()] || "default";
  };

  const handleViewAlertDetails = (alert) => {
    setSelectedAlert(alert);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <Typography>Loading maintenance plans...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Unresolved Alerts Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Unresolved Alerts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Severity</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Maintenance Plan</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {unresolvedAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ py: 2 }}
                  >
                    No unresolved alerts
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              unresolvedAlerts.map((alert) => (
                <React.Fragment key={alert.id}>
                  <TableRow>
                    <TableCell>
                      <Chip
                        label={getSeverityLabel(alert.severity)}
                        color={getSeverityColor(alert.severity)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(alert.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {devices.find((d) => d.id === alert.device_id)?.name ||
                        "Unknown Device"}
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => toggleExpand(alert.id)}>
                        {expandedAlerts[alert.id] ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewAlertDetails(alert)}
                        >
                          <VisibilityOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  {expandedAlerts[alert.id] && maintenancePlans[alert.id] && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Box sx={{ p: 2, bgcolor: "background.paper" }}>
                          <Typography variant="subtitle1" gutterBottom>
                            Maintenance Plan
                          </Typography>
                          <List>
                            {maintenancePlans[alert.id].steps.map(
                              (step, index) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <CircleIcon sx={{ fontSize: 8 }} />
                                  </ListItemIcon>
                                  <ListItemText primary={step} />
                                </ListItem>
                              )
                            )}
                          </List>
                          <Typography
                            variant="subtitle1"
                            gutterBottom
                            sx={{ mt: 2 }}
                          >
                            Preventative Measures
                          </Typography>
                          <List>
                            {maintenancePlans[
                              alert.id
                            ].preventative_measures.map((measure, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  <CircleIcon sx={{ fontSize: 8 }} />
                                </ListItemIcon>
                                <ListItemText primary={measure} />
                              </ListItem>
                            ))}
                          </List>
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              Estimated Time:{" "}
                              {maintenancePlans[alert.id].estimated_time} hours
                            </Typography>
                            <Typography variant="body2">
                              Required Tools:{" "}
                              {maintenancePlans[alert.id].required_tools.join(
                                ", "
                              )}
                            </Typography>
                            <Typography variant="body2">
                              Skill Level:{" "}
                              {maintenancePlans[alert.id].skill_level}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resolved Alerts Section */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Resolved Alerts
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Severity</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>Device</TableCell>
              <TableCell>Message</TableCell>
              <TableCell>Resolution Notes</TableCell>
              <TableCell>Resolved At</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resolvedAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    sx={{ py: 2 }}
                  >
                    No resolved alerts
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              resolvedAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    <Chip
                      label={getSeverityLabel(alert.severity)}
                      color={getSeverityColor(alert.severity)}
                      size="small"
                      sx={{ fontWeight: "medium" }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(alert.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {devices.find((d) => d.id === alert.device_id)?.name ||
                      "Unknown Device"}
                  </TableCell>
                  <TableCell>{alert.message}</TableCell>
                  <TableCell>{getResolutionNotes(alert)}</TableCell>
                  <TableCell>{getResolutionTimestamp(alert)}</TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewAlertDetails(alert)}
                    >
                      <VisibilityOutlined fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Simple Alert Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedAlert && (
          <>
            <DialogTitle
              sx={{
                bgcolor: "success.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                gap: 1,
                py: 2,
              }}
            >
              <CheckCircleIcon />
              Resolved Alert Details
            </DialogTitle>
            <DialogContent sx={{ mt: 2, pb: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Device:</strong>{" "}
                  {devices.find((d) => d.id === selectedAlert.device_id)
                    ?.name || "Unknown Device"}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Alert Type:</strong>{" "}
                  {selectedAlert.alert_type || "warning"}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Message:</strong> {selectedAlert.message}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Created At:</strong>{" "}
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Resolution Details
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Resolution Notes:</strong>{" "}
                  {getResolutionNotes(selectedAlert)}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Resolved At:</strong>{" "}
                  {getResolutionTimestamp(selectedAlert)}
                </Typography>
              </Box>
              <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  onClick={() => setShowDetailsDialog(false)}
                  variant="contained"
                  color="primary"
                >
                  Close
                </Button>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default MaintenanceTab;

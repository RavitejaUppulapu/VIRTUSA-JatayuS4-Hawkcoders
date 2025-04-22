import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
} from "@mui/material";

const AlertDialog = ({ alert, open, onClose, onResolve }) => {
  const [resolutionNotes, setResolutionNotes] = useState("");

  const handleResolve = () => {
    onResolve(alert.id, resolutionNotes);
    setResolutionNotes("");
    onClose();
  };

  if (!alert) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Alert Details
        {alert.resolved && (
          <Chip label="RESOLVED" color="success" size="small" sx={{ ml: 2 }} />
        )}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Device:</strong> {alert.device_name}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Severity:</strong> {alert.severity}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Timestamp:</strong>{" "}
            {new Date(alert.timestamp).toLocaleString()}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            <strong>Message:</strong> {alert.message}
          </Typography>
          {alert.resolved && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Resolution Notes:</strong>{" "}
                {alert.resolution_notes || "No notes provided"}
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Resolved At:</strong>{" "}
                {alert.resolved_at
                  ? new Date(alert.resolved_at).toLocaleString()
                  : "Unknown"}
              </Typography>
            </>
          )}
        </Box>

        {!alert.resolved && (
          <TextField
            label="Resolution Notes"
            multiline
            rows={4}
            fullWidth
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            variant="outlined"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!alert.resolved && (
          <Button onClick={handleResolve} color="primary" variant="contained">
            Resolve Alert
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AlertDialog;

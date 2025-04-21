import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Thermostat as TemperatureIcon,
  WaterDrop as HumidityIcon,
  Speed as VibrationIcon,
  Bolt as PowerIcon,
  ElectricBolt as VoltageIcon,
  ElectricMeter as CurrentIcon,
  NetworkPing as PacketLossIcon,
  Speed as BandwidthIcon,
  LocalGasStation as FuelIcon,
  OilBarrel as OilIcon,
  Storage as DiskIcon,
  Timer as LatencyIcon,
} from "@mui/icons-material";
import axios from "axios";

// Utility functions
const getUnitForSensor = (sensor) => {
  switch (sensor) {
    case 'temperature': return '°C';
    case 'humidity': return '%';
    case 'power': return 'kW';
    case 'voltage': return 'V';
    case 'current': return 'A';
    case 'packet_loss': return '%';
    case 'bandwidth': return 'Mbps';
    case 'fuel_level': return '%';
    case 'oil_pressure': return 'psi';
    case 'disk_usage': return '%';
    case 'read_latency': return 'ms';
    default: return '';
  }
};

const getSensorIcon = (sensor) => {
  switch (sensor) {
    case "temperature": return <TemperatureIcon />;
    case "humidity": return <HumidityIcon />;
    case "vibration": return <VibrationIcon />;
    case "power": return <PowerIcon />;
    case "voltage": return <VoltageIcon />;
    case "current": return <CurrentIcon />;
    case "packet_loss": return <PacketLossIcon />;
    case "bandwidth": return <BandwidthIcon />;
    case "fuel_level": return <FuelIcon />;
    case "oil_pressure": return <OilIcon />;
    case "disk_usage": return <DiskIcon />;
    case "read_latency": return <LatencyIcon />;
    default: return null;
  }
};

const getStatusStyle = (status) => {
  const colorMap = {
    "operational": { bgColor: "#4caf50", textColor: "#fff" },
    "degraded": { bgColor: "#ff9800", textColor: "#fff" },
    "warning": { bgColor: "#ffeb3b", textColor: "#000" },
    "critical": { bgColor: "#f44336", textColor: "#fff" },
    "maintenance required": { bgColor: "#ff5722", textColor: "#fff" },
    "under maintenance": { bgColor: "#2196f3", textColor: "#fff" },
    "out of service": { bgColor: "#9e9e9e", textColor: "#fff" },
    "disconnected": { bgColor: "#757575", textColor: "#fff" },
    "standby": { bgColor: "#607d8b", textColor: "#fff" },
    "testing": { bgColor: "#9c27b0", textColor: "#fff" },
    "battery low": { bgColor: "#fbc02d", textColor: "#000" },
    "temperature alert": { bgColor: "#e53935", textColor: "#fff" },
    "firmware update": { bgColor: "#00bcd4", textColor: "#fff" },
    "calibration needed": { bgColor: "#795548", textColor: "#fff" },
    "unknown": { bgColor: "#e0e0e0", textColor: "#000" },
  };
  const key = status.toLowerCase();
  return colorMap[key] || colorMap["unknown"];
};

const DeviceStatus = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [devices, setDevices] = useState([]);
  const [sensorData, setSensorData] = useState({});
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devicesResponse, sensorResponse] = await Promise.all([
          axios.get("http://localhost:8000/device-status"),
          axios.get("http://localhost:8000/sensor-data"),
        ]);
        setDevices(Object.values(devicesResponse.data));
        setSensorData(sensorResponse.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch device data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSensorData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/sensor-data");
        setSensorData((prevData) => {
          const newData = response.data;
          const mergedData = { ...prevData };
          for (const deviceId in newData) {
            if (!mergedData[deviceId]) {
              mergedData[deviceId] = [];
            }
            const existingTimestamps = new Set(mergedData[deviceId].map((d) => d.rawTime));
            const uniqueNewData = newData[deviceId].filter((d) => !existingTimestamps.has(d.raw_timestamp));
            mergedData[deviceId] = [...mergedData[deviceId], ...uniqueNewData];
          }
          return mergedData;
        });
      } catch (err) {
        console.error("Failed to fetch sensor data", err);
      }
    };
    fetchSensorData();
    const intervalId = setInterval(fetchSensorData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const formatSensorData = (deviceId) => {
    if (!sensorData[deviceId]) return [];
    return sensorData[deviceId].map((reading) => {
      const formatted = {
        name: new Date(reading.raw_timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        rawTime: reading.raw_timestamp
      };
      for (const key in reading) {
        if (key !== 'timestamp' && key !== 'raw_timestamp' && reading[key] !== undefined) {
          formatted[key] = reading[key];
        }
      }
      return formatted;
    });
  };
  
  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const filteredDevices = devices.filter(device =>
    statusFilter === '' || device.status.toLowerCase() === statusFilter.toLowerCase()
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
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

  return (
    <Box p={2} sx={{ backgroundColor: "#f5f5f5" }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Device Status
        </Typography>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">Filter by Status:</Typography>
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="">All</option>
            <option value="operational">Operational</option>
            <option value="degraded">Degraded</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="maintenance required">Maintenance Required</option>
            <option value="under maintenance">Under Maintenance</option>
            <option value="out of service">Out of Service</option>
            <option value="disconnected">Disconnected</option>
            <option value="standby">Standby</option>
            <option value="testing">Testing</option>
            <option value="battery low">Battery Low</option>
            <option value="temperature alert">Temperature Alert</option>
            <option value="firmware update">Firmware Update</option>
            <option value="calibration needed">Calibration Needed</option>
            <option value="unknown">Unknown</option>
          </select>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredDevices.map((device) => {
          const statusStyle = getStatusStyle(device.status);
          return (
            <Grid item xs={12} sm={12} md={6} lg={4} key={device.id}>
              <Card
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  borderRadius: 2,
                  cursor: "pointer",
                  '&:hover': {
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                  },
                }}
                onClick={() => window.location.href = `/device-status/${device.id}`}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>{device.name}</Typography>
                    <Chip
                      label={device.status}
                      size="small"
                      sx={{
                        fontWeight: "bold",
                        color: statusStyle.textColor,
                        backgroundColor: statusStyle.bgColor,
                        textTransform: "capitalize",
                        ml: 'auto'
                      }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Location: <strong>{device.location}</strong> | Type: <strong>{device.type}</strong>
                  </Typography>

                  {/* ✅ UPDATED GRAPH SECTION BELOW */}
                  <Box mt={2} sx={{ backgroundColor: "#ffffff", borderRadius: 1, boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                    <Typography variant="subtitle1" fontWeight="bold">Sensor History</Typography>
                    {formatSensorData(device.id).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">No sensor history available</Typography>
                    ) : (
                      <Box sx={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={formatSensorData(device.id)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                            <YAxis tick={{ fontSize: 10 }} />
                            <RechartsTooltip
                              formatter={(value, name) => {
                                const formattedName = name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
                                return [`${value}${getUnitForSensor(name)}`, formattedName];
                              }}
                              labelFormatter={(label) => {
                                if (!label) return "";
                                const [hours, minutes] = label.split(':');
                                const hour = parseInt(hours);
                                const ampm = hour >= 12 ? 'PM' : 'AM';
                                const hour12 = hour % 12 || 12;
                                return `${hour12}:${minutes} ${ampm}`;
                              }}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 10px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                              itemStyle={{
                                color: '#333',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                padding: '2px 0'
                              }}
                              labelStyle={{
                                color: '#000',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                marginBottom: '4px'
                              }}
                              wrapperStyle={{
                                zIndex: 100,
                                outline: 'none'
                              }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: 10 }}
                              formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ')}
                            />
                            {Object.keys(device.sensors).map((sensor, idx) => (
                              <Line
                                key={sensor}
                                type="monotone"
                                dataKey={sensor}
                                stroke={`hsl(${idx * 45}, 70%, 50%)`}
                                strokeWidth={2}
                                dot={false}
                                name={sensor}
                                isAnimationActive={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                  </Box>

                  <Box mt={3}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Current Sensor Readings
                    </Typography>
                    <Grid container spacing={1}>
                      {Object.entries(device.sensors).map(([sensor, value]) => (
                        <Grid item xs={12} sm={6} key={sensor}>
                          <Paper
                            elevation={1}
                            sx={{
                              p: 1,
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Tooltip title={sensor}>
                              <IconButton size="small">{getSensorIcon(sensor)}</IconButton>
                            </Tooltip>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {value} {getUnitForSensor(sensor)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {sensor.replace("_", " ")}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Last Updated: {new Date().toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default DeviceStatus;
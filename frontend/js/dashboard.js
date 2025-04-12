const API_URL = "http://localhost:8000";

// Chart configuration
const chartConfig = {
  temperature: {
    label: "Temperature (°C)",
    color: "#ff4444",
    threshold: { min: 18, max: 24 },
  },
  humidity: {
    label: "Humidity (%)",
    color: "#00C851",
    threshold: { min: 45, max: 55 },
  },
  vibration: {
    label: "Vibration",
    color: "#33b5e5",
    threshold: { min: 0, max: 0.5 },
  },
};

// Initialize data structures
let deviceData = {};
let alertHistory = [];
let maintenanceSchedule = [];
let chart = null;
let uptime = {};
let performanceMetrics = {};

// Initialize real-time chart
function initializeRealtimeChart() {
  const ctx = document.getElementById("realtimeChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature",
          data: [],
          borderColor: chartConfig.temperature.color,
          fill: false,
        },
        {
          label: "Humidity",
          data: [],
          borderColor: chartConfig.humidity.color,
          fill: false,
        },
        {
          label: "Vibration",
          data: [],
          borderColor: chartConfig.vibration.color,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      animation: false,
      scales: {
        x: {
          type: "time",
          time: {
            unit: "minute",
            displayFormats: {
              minute: "HH:mm",
            },
          },
          title: {
            display: true,
            text: "Time",
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// Update system health score
function updateHealthScore(score) {
  const healthScoreElement = document.getElementById("healthScore");
  const healthIndicator = document.getElementById("healthIndicator");

  healthScoreElement.textContent = score.toFixed(1);

  // Update health indicator color
  if (score >= 90) {
    healthIndicator.className = "health-indicator optimal";
  } else if (score >= 70) {
    healthIndicator.className = "health-indicator good";
  } else if (score >= 50) {
    healthIndicator.className = "health-indicator warning";
  } else {
    healthIndicator.className = "health-indicator critical";
  }

  // Update trend indicator
  const previousScore = parseFloat(
    healthScoreElement.dataset.previousScore || score
  );
  const trendIndicator = document.getElementById("healthTrend");

  if (score > previousScore) {
    trendIndicator.innerHTML = "↑";
    trendIndicator.className = "trend-up";
  } else if (score < previousScore) {
    trendIndicator.innerHTML = "↓";
    trendIndicator.className = "trend-down";
  } else {
    trendIndicator.innerHTML = "→";
    trendIndicator.className = "trend-stable";
  }

  healthScoreElement.dataset.previousScore = score;
}

// Update recent alerts section
async function updateRecentAlerts() {
  const alertsContainer = document.getElementById("recentAlerts");
  const alerts = await fetchAlerts();

  alertsContainer.innerHTML = "";
  alerts.slice(0, 5).forEach((alert) => {
    const alertElement = document.createElement("div");
    alertElement.className = `alert-item ${alert.severity}`;

    const timestamp = new Date(alert.timestamp).toLocaleString();
    alertElement.innerHTML = `
      <div class="alert-header">
        <span class="alert-device">${alert.device_id}</span>
        <span class="alert-time">${timestamp}</span>
      </div>
      <div class="alert-message">${alert.message}</div>
      <div class="alert-meta">
        <span class="alert-type">${alert.alert_type}</span>
        <span class="alert-severity">${alert.severity}</span>
      </div>
    `;

    alertsContainer.appendChild(alertElement);
  });
}

// Update device status summary
async function updateDeviceStatus() {
  const devices = await fetchDevices();
  const statusSummary = {
    total: devices.length,
    operational: 0,
    warning: 0,
    critical: 0,
    maintenance: 0,
  };

  devices.forEach((device) => {
    statusSummary[device.status.toLowerCase()]++;
  });

  // Update status counters
  Object.keys(statusSummary).forEach((status) => {
    const element = document.getElementById(`${status}Count`);
    if (element) {
      element.textContent = statusSummary[status];
    }
  });

  // Update availability metrics
  const availability = (
    (statusSummary.operational / statusSummary.total) *
    100
  ).toFixed(1);
  document.getElementById(
    "availabilityMetric"
  ).textContent = `${availability}%`;
}

// Update maintenance schedule
async function updateMaintenanceSchedule() {
  const maintenanceContainer = document.getElementById("maintenanceSchedule");
  const schedule = await fetchMaintenanceSchedule();

  maintenanceContainer.innerHTML = "";
  schedule.slice(0, 3).forEach((maintenance) => {
    const element = document.createElement("div");
    element.className = "maintenance-item";
    element.innerHTML = `
      <div class="maintenance-header">
        <span class="maintenance-device">${maintenance.device_id}</span>
        <span class="maintenance-date">${new Date(
          maintenance.scheduled_date
        ).toLocaleDateString()}</span>
      </div>
      <div class="maintenance-type">${maintenance.maintenance_type}</div>
      <div class="maintenance-status ${maintenance.status.toLowerCase()}">${
      maintenance.status
    }</div>
    `;
    maintenanceContainer.appendChild(element);
  });
}

// Update performance metrics
function updatePerformanceMetrics(data) {
  const metrics = {
    responseTime: calculateAverageResponseTime(data),
    errorRate: calculateErrorRate(data),
    throughput: calculateThroughput(data),
  };

  Object.keys(metrics).forEach((metric) => {
    const element = document.getElementById(`${metric}Value`);
    if (element) {
      element.textContent = formatMetricValue(metric, metrics[metric]);
    }
  });
}

// Calculate system health score
function calculateSystemHealth(devices, sensorData) {
  let totalScore = 0;
  let deviceCount = 0;

  devices.forEach((device) => {
    let deviceScore = 100;
    const deviceSensors = sensorData.filter((d) => d.device_id === device.id);

    // Reduce score based on device status
    switch (device.status.toLowerCase()) {
      case "warning":
        deviceScore *= 0.8;
        break;
      case "critical":
        deviceScore *= 0.5;
        break;
      case "maintenance":
        deviceScore *= 0.7;
        break;
    }

    // Check sensor thresholds
    deviceSensors.forEach((reading) => {
      Object.keys(chartConfig).forEach((metric) => {
        const value = reading[metric];
        const { min, max } = chartConfig[metric].threshold;

        if (value < min || value > max) {
          deviceScore *= 0.9;
        }
      });
    });

    totalScore += deviceScore;
    deviceCount++;
  });

  return deviceCount > 0 ? totalScore / deviceCount : 0;
}

// Update real-time data
async function updateRealtimeData() {
  try {
    const [deviceResponse, sensorResponse] = await Promise.all([
      fetch(`${API_URL}/devices`),
      fetch(`${API_URL}/sensor-data`),
    ]);

    const devices = await deviceResponse.json();
    const sensorData = await sensorResponse.json();

    // Update chart data
    const timestamp = new Date();
    chart.data.labels.push(timestamp);

    // Maintain last 20 data points
    if (chart.data.labels.length > 20) {
      chart.data.labels.shift();
      chart.data.datasets.forEach((dataset) => dataset.data.shift());
    }

    // Calculate averages for all devices
    const averages = {
      temperature: 0,
      humidity: 0,
      vibration: 0,
    };

    let deviceCount = 0;
    sensorData.forEach((reading) => {
      Object.keys(averages).forEach((metric) => {
        averages[metric] += reading[metric];
      });
      deviceCount++;
    });

    Object.keys(averages).forEach((metric) => {
      averages[metric] /= deviceCount || 1;
      chart.data.datasets
        .find(
          (d) => d.label === metric.charAt(0).toUpperCase() + metric.slice(1)
        )
        .data.push(averages[metric]);
    });

    chart.update();

    // Update health score
    const healthScore = calculateSystemHealth(devices, sensorData);
    updateHealthScore(healthScore);

    // Update other components
    updateDeviceStatus();
    updatePerformanceMetrics(sensorData);
  } catch (error) {
    console.error("Error updating real-time data:", error);
  }
}

// Initialize dashboard
async function initializeDashboard() {
  try {
    initializeRealtimeChart();
    await Promise.all([
      updateRealtimeData(),
      updateRecentAlerts(),
      updateMaintenanceSchedule(),
    ]);

    // Set up periodic updates
    setInterval(updateRealtimeData, 5000); // Update real-time data every 5 seconds
    setInterval(updateRecentAlerts, 30000); // Update alerts every 30 seconds
    setInterval(updateMaintenanceSchedule, 60000); // Update maintenance schedule every minute
  } catch (error) {
    console.error("Error initializing dashboard:", error);
  }
}

// Helper functions for performance metrics
function calculateAverageResponseTime(data) {
  // Implementation for calculating average response time
  return Math.random() * 100 + 50; // Placeholder
}

function calculateErrorRate(data) {
  // Implementation for calculating error rate
  return (Math.random() * 2).toFixed(2); // Placeholder
}

function calculateThroughput(data) {
  // Implementation for calculating throughput
  return Math.floor(Math.random() * 1000 + 500); // Placeholder
}

function formatMetricValue(metric, value) {
  switch (metric) {
    case "responseTime":
      return `${value.toFixed(0)}ms`;
    case "errorRate":
      return `${value}%`;
    case "throughput":
      return `${value}/min`;
    default:
      return value;
  }
}

// Start dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeDashboard);

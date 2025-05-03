const API_URL = "https://pmbi-backend.onrender.com";
let deviceTable;
let devices = [];

// Initialize DataTable for devices
function initializeDeviceTable() {
  deviceTable = new DataTable("#deviceTable", {
    columns: [
      { data: "device_id", title: "Device ID" },
      { data: "name", title: "Name" },
      {
        data: "status",
        title: "Status",
        render: function (data) {
          const statusClass =
            data === "online"
              ? "success"
              : data === "offline"
              ? "danger"
              : "warning";
          return `<span class="badge bg-${statusClass}">${data}</span>`;
        },
      },
      {
        data: "health_score",
        title: "Health Score",
        render: function (data) {
          const scoreClass =
            data >= 90 ? "success" : data >= 70 ? "warning" : "danger";
          return `<div class="progress">
                                <div class="progress-bar bg-${scoreClass}" 
                                     role="progressbar" 
                                     style="width: ${data}%"
                                     aria-valuenow="${data}" 
                                     aria-valuemin="0" 
                                     aria-valuemax="100">
                                    ${data}%
                                </div>
                            </div>`;
        },
      },
      {
        data: "last_maintenance",
        title: "Last Maintenance",
        render: function (data) {
          return moment(data).format("YYYY-MM-DD HH:mm");
        },
      },
      {
        data: null,
        title: "Actions",
        render: function (data) {
          return `<button class="btn btn-sm btn-primary" 
                                   onclick="showDeviceDetails('${data.device_id}')">
                                Details
                            </button>`;
        },
      },
    ],
    order: [[3, "desc"]],
    pageLength: 10,
    responsive: true,
  });
}

// Fetch and update device list
async function updateDeviceList() {
  try {
    const response = await fetch(`${API_URL}/devices`);
    devices = await response.json();

    // Update device table
    deviceTable.clear();
    deviceTable.rows.add(devices);
    deviceTable.draw();

    // Update device statistics
    updateDeviceStats();
  } catch (error) {
    console.error("Failed to fetch devices:", error);
    showError("Failed to load device data");
  }
}

// Update device statistics
function updateDeviceStats() {
  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === "online").length;
  const criticalDevices = devices.filter((d) => d.health_score < 70).length;

  document.getElementById("totalDevicesCount").textContent = totalDevices;
  document.getElementById("onlineDevicesCount").textContent = onlineDevices;
  document.getElementById("criticalDevicesCount").textContent = criticalDevices;
}

// Show detailed device information
async function showDeviceDetails(deviceId) {
  try {
    const [deviceResponse, predictionResponse] = await Promise.all([
      fetch(`${API_URL}/devices/${deviceId}`),
      fetch(`${API_URL}/predictions/${deviceId}`)
    ]);
    
    const device = await deviceResponse.json();
    const predictions = await predictionResponse.json();

    const modal = new bootstrap.Modal(document.getElementById('deviceModal'));
    document.getElementById('deviceModalTitle').textContent = `Device: ${device.name}`;
    
    // Update device details with ML predictions
    const detailsHtml = `
        <div class="row">
            <div class="col-md-6">
                <h5>General Information</h5>
                <table class="table">
                    <tr>
                        <th>Device ID</th>
                        <td>${device.device_id}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td><span class="badge bg-${device.status === 'online' ? 'success' : 'danger'}">
                            ${device.status}
                        </span></td>
                    </tr>
                    <tr>
                        <th>Health Score</th>
                        <td>${device.health_score}%</td>
                    </tr>
                    <tr>
                        <th>Last Maintenance</th>
                        <td>${moment(device.last_maintenance).format('YYYY-MM-DD HH:mm')}</td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h5>Predictive Analytics</h5>
                <div class="card mb-3 ${predictions.failure_probability > 0.7 ? 'bg-danger' : 
                                     predictions.failure_probability > 0.3 ? 'bg-warning' : 'bg-success'}">
                    <div class="card-body">
                        <h6 class="card-title">Failure Probability</h6>
                        <div class="display-4">${(predictions.failure_probability * 100).toFixed(1)}%</div>
                        <p class="card-text">Predicted within next 24 hours</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Maintenance Recommendation</h6>
                        <p class="card-text">${predictions.maintenance_recommendation}</p>
                        <p class="text-muted">Next maintenance window: ${predictions.next_maintenance_window}</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-md-6">
                <h5>Sensor Data</h5>
                <table class="table">
                    ${Object.entries(device.sensors || {}).map(([key, value]) => `
                        <tr>
                            <th>${key.charAt(0).toUpperCase() + key.slice(1)}</th>
                            <td>
                                ${value}
                                ${predictions.anomalies && predictions.anomalies[key] ? 
                                    '<span class="badge bg-warning ms-2">Anomaly Detected</span>' : ''}
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
            <div class="col-md-6">
                <h5>Recent Alerts</h5>
                <div id="deviceAlerts">
                    ${await getDeviceAlerts(deviceId)}
                </div>
            </div>
        </div>
        <div class="row mt-3">
            <div class="col-12">
                <h5>Predicted Maintenance Timeline</h5>
                <div class="timeline">
                    ${predictions.maintenance_timeline.map(event => `
                        <div class="timeline-item">
                            <div class="timeline-date">${moment(event.date).format('YYYY-MM-DD')}</div>
                            <div class="timeline-content">
                                <h6>${event.type}</h6>
                                <p>${event.description}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('deviceModalBody').innerHTML = detailsHtml;
    modal.show();
  } catch (error) {
    console.error('Failed to fetch device details:', error);
    showError('Failed to load device details');
  }
}

// Get recent alerts for a specific device
async function getDeviceAlerts(deviceId) {
  try {
    const response = await fetch(
      `${API_URL}/alerts?device_id=${deviceId}&limit=5`
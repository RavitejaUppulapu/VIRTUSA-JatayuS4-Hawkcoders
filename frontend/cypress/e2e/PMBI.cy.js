describe("PMBI App E2E", () => {
  beforeEach(() => {
    // Intercept API calls to ensure consistent test data
    cy.intercept("GET", "http://localhost:8000/alerts", {
      fixture: "alerts.json",
    }).as("getAlerts");
    cy.intercept("GET", "http://localhost:8000/devices", {
      fixture: "devices.json",
    }).as("getDevices");
    cy.intercept("GET", "http://localhost:8000/dashboard/predictions", {
      fixture: "predictions.json",
    }).as("getPredictions");
    cy.intercept("GET", "http://localhost:8000/sensor-data", {
      fixture: "sensorData.json",
    }).as("getSensorData");
    cy.intercept("GET", "http://localhost:8000/reports/device-metrics", {
      fixture: "deviceMetrics.json",
    }).as("getDeviceMetrics");
    cy.intercept("GET", "http://localhost:8000/reports/alert-analysis", {
      fixture: "alertAnalysis.json",
    }).as("getAlertAnalysis");
    cy.intercept("GET", "http://localhost:8000/reports/maintenance-analysis", {
      fixture: "maintenanceAnalysis.json",
    }).as("getMaintenanceAnalysis");
    cy.intercept("GET", "http://localhost:8000/settings", {
      fixture: "settings.json",
    }).as("getSettings");
    cy.intercept("POST", "http://localhost:8000/alerts/*/acknowledge", {
      statusCode: 200,
      body: { message: "Alert acknowledged successfully" },
    }).as("acknowledgeAlert");
    cy.intercept("POST", "http://localhost:8000/ai-chat", {
      statusCode: 200,
      body: {
        response:
          "I'm your AI maintenance assistant. How can I help you today?",
      },
    }).as("aiChat");
  });

  describe("App Initialization", () => {
    it.skip("Visits the React App and checks for title", () => {
      cy.visit("http://localhost:3000");
      cy.contains("Predictive Maintenance System");
      cy.get("h6").should("contain", "Predictive Maintenance System");
    });

    it("Shows loading state and then loads dashboard", () => {
      cy.visit("http://localhost:3000");
      cy.wait(["@getAlerts", "@getDevices", "@getPredictions"]);
      cy.contains("System Overview");
    });
  });

  describe("Navigation", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000");
      cy.wait(["@getAlerts", "@getDevices", "@getPredictions"]);
      // Open the navigation drawer
      cy.get('[aria-label="open drawer"]').click();
      cy.get(".MuiDrawer-paper").should("be.visible");
    });

    it("Navigates to Dashboard", () => {
      cy.get(".MuiDrawer-paper").within(() => {
        cy.contains("Dashboard").click();
      });
      cy.url().should("eq", "http://localhost:3000/");
      cy.contains("System Overview");
    });

    it("Navigates to Device Status", () => {
      cy.get(".MuiDrawer-paper").within(() => {
        cy.contains("Device Status").click();
      });
      cy.url().should("include", "/device-status");
      cy.contains("Device Status");
    });

    it("Navigates to Alerts", () => {
      cy.get(".MuiDrawer-paper").within(() => {
        cy.contains("Alerts").click();
      });
      cy.url().should("include", "/alerts");
      cy.contains("Alert Management System");
    });

    it("Navigates to Settings", () => {
      cy.get(".MuiDrawer-paper").within(() => {
        cy.contains("Settings").click();
      });
      cy.url().should("include", "/settings");
      cy.contains("System Settings");
    });

    it("Closes navigation drawer when clicking outside", () => {
      cy.get(".MuiDrawer-paper").should("be.visible");
      cy.get("body").click(0, 0); // Click outside the drawer
      cy.get(".MuiDrawer-paper").should("not.be.visible");
    });

    it.skip("Closes navigation drawer when clicking close button", () => {
      cy.get(".MuiDrawer-paper").should("be.visible");
      cy.get('[aria-label="close drawer"]').click();
      cy.get(".MuiDrawer-paper").should("not.be.visible");
    });
  });

  describe("Dashboard", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/");
      cy.wait(["@getAlerts", "@getDevices", "@getPredictions"]);
    });

    it("Shows dashboard statistics and overview", () => {
      cy.contains("System Overview");
      cy.contains("Alerts & Issues");
      cy.contains("Predictions");
      cy.contains("Maintenance");
      cy.contains("Overview");
    });

    it.skip("Displays KPI cards with data", () => {
      cy.get('[data-testid="kpi-card"]').should("have.length.at.least", 1);
      cy.contains("Critical Alerts");
      cy.contains("Warning Alerts");
      cy.contains("Info Alerts");
    });

    it.skip("Shows device status overview", () => {
      cy.contains("Device Status");
      cy.get('[data-testid="device-status-card"]').should("exist");
    });

    it.skip("Displays recent alerts section", () => {
      cy.contains("Recent Alerts");
      cy.get('[data-testid="recent-alerts"]').should("exist");
    });

    it.skip("Shows sensor data charts", () => {
      cy.contains("Sensor Data");
      cy.get('[data-testid="sensor-chart"]').should("exist");
    });
  });

  describe("Dashboard Tabs", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/");
      cy.wait(["@getAlerts", "@getDevices", "@getPredictions"]);
    });

    it("Switches to Predictions tab", () => {
      cy.contains("Predictions").click();
      cy.contains("Predictions");
      cy.get('[data-testid="predictions-tab"]').should("be.visible");
    });

    it.skip("Switches to Maintenance tab", () => {
      cy.contains("Maintenance").click();
      cy.contains("Maintenance");
      cy.get('[data-testid="maintenance-tab"]').should("be.visible");
    });

    it.skip("Switches back to Overview tab", () => {
      cy.contains("Predictions").click();
      cy.contains("Overview").click();
      cy.get('[data-testid="overview-tab"]').should("be.visible");
    });
  });

  describe("Alerts Page", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/alerts");
      cy.wait(["@getAlerts", "@getDevices"]);
    });

    it("Shows alerts page with statistics", () => {
      cy.contains("Alert Management System");
      cy.contains("Critical Alerts");
      cy.contains("Warning Alerts");
      cy.contains("Info Alerts");
      cy.contains("Resolved Alerts");
    });

    it("Displays alerts table with correct headers", () => {
      cy.get("table").should("exist");
      cy.get("table thead").contains("Severity");
      cy.get("table thead").contains("Device");
      cy.get("table thead").contains("Alert Type");
      cy.get("table thead").contains("Message");
      cy.get("table thead").contains("Status");
      cy.get("table thead").contains("Actions");
    });

    it("Shows alert trends chart", () => {
      cy.contains("Alert Trends");
      cy.get('[data-testid="alert-trends-chart"]').should("exist");
    });

    it("Filters alerts by severity", () => {
      cy.get('label:contains("Severity")')
        .parent()
        .find(".MuiSelect-select")
        .click();
      cy.get(".MuiMenu-root .MuiMenuItem-root").contains("Critical").click();
      cy.wait(1000);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
    });

    it("Filters alerts by device", () => {
      cy.get('label:contains("Device")')
        .parent()
        .find(".MuiSelect-select")
        .click();
      cy.get(".MuiMenu-root .MuiMenuItem-root").first().click();
      cy.wait(1000);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
    });

    it("Searches alerts by text", () => {
      cy.get('input[placeholder="Search alerts..."]').type("temperature");
      cy.wait(1000);
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
    });

    it("Switches between Active and Resolved alerts tabs", () => {
      cy.contains("Active Alerts").click();
      cy.get('[data-testid="active-alerts-tab"]').should("be.visible");

      cy.contains("Resolved Alerts").click();
      cy.get('[data-testid="resolved-alerts-tab"]').should("be.visible");
    });

    it("Sorts alerts by severity", () => {
      cy.get("th").contains("Severity").click();
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
    });

    it("Sorts alerts by timestamp", () => {
      cy.get("th").contains("Timestamp").click();
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
    });

    it.skip("Changes pagination", () => {
      cy.get('[data-testid="pagination-select"]').click();
      cy.get(".MuiMenuItem-root").contains("25").click();
      cy.get("table tbody tr").should("have.length.at.most", 25);
    });
  });

  describe("Alert Details and Resolution", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/alerts");
      cy.wait(["@getAlerts", "@getDevices"]);
    });

    it("Opens alert details dialog", () => {
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get('[aria-label="View Details"]').click();
        });
      cy.get('[data-testid="alert-details-dialog"]').should("be.visible");
      cy.contains("Alert Details");
    });

    it("Shows alert details in dialog", () => {
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get('[aria-label="View Details"]').click();
        });
      cy.get('[data-testid="alert-details-dialog"]').within(() => {
        cy.contains("Device");
        cy.contains("Alert Type");
        cy.contains("Message");
        cy.contains("Created At");
      });
    });

    it("Acknowledges and resolves an alert", () => {
      // Find an unresolved alert with acknowledge button
      cy.get("table tbody tr").each(($row) => {
        cy.wrap($row).within(() => {
          cy.get(".MuiChip-label").then(($chip) => {
            if ($chip.text().includes("Unresolved")) {
              cy.get('[aria-label="Acknowledge"]').then(($btn) => {
                if ($btn.length > 0) {
                  cy.wrap($btn).click({ force: true });
                  return false; // Break the loop
                }
              });
            }
          });
        });
      });

      cy.get('[data-testid="alert-details-dialog"]').should("be.visible");
      cy.get('[data-testid="resolution-notes-input"]').type(
        "Resolved via E2E test"
      );
      cy.contains("Acknowledge & Resolve").click();
      cy.wait("@acknowledgeAlert");
      cy.contains("Alert successfully resolved").should("be.visible");
    });

    it("Validates resolution notes are required", () => {
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get('[aria-label="Acknowledge"]').click();
        });
      cy.get('[data-testid="alert-details-dialog"]').should("be.visible");
      cy.contains("Acknowledge & Resolve").should("be.disabled");
      cy.get('[data-testid="resolution-notes-input"]').type("Test notes");
      cy.contains("Acknowledge & Resolve").should("not.be.disabled");
    });

    it.skip("Closes alert details dialog", () => {
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get('[aria-label="View Details"]').click();
        });
      cy.get('[data-testid="alert-details-dialog"]').should("be.visible");
      cy.contains("Close").click();
      cy.get('[data-testid="alert-details-dialog"]').should("not.be.visible");
    });
  });

  describe("Device Status Page", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/device-status");
      cy.wait(["@getDevices", "@getAlerts"]);
    });

    it("Shows device status page", () => {
      cy.contains("Device Status");
      cy.get('[data-testid="device-status-grid"]').should("exist");
    });

    it.skip("Displays device cards with information", () => {
      cy.get('[data-testid="device-card"]').should("have.length.at.least", 1);
      cy.get('[data-testid="device-card"]')
        .first()
        .within(() => {
          cy.contains("Location:");
          cy.contains("Type:");
          cy.contains("Status:");
          cy.contains("Last Check:");
        });
    });

    it.skip("Shows device sensor data", () => {
      cy.get('[data-testid="device-card"]')
        .first()
        .within(() => {
          cy.contains("Sensor Data:");
          cy.get('[data-testid="sensor-data"]').should("exist");
        });
    });

    it.skip("Displays device health indicators", () => {
      cy.get('[data-testid="device-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="health-indicator"]').should("exist");
        });
    });

    it("Navigates to device details page", () => {
      cy.get('[data-testid="device-card"]')
        .first()
        .within(() => {
          cy.get('[data-testid="view-details-button"]').click();
        });
      cy.url().should("include", "/device-status/");
    });
  });

  describe("Device Details Page", () => {
    it("Shows detailed device information", () => {
      cy.request("http://localhost:8000/devices").then((response) => {
        const deviceId = response.body[0]?.id;
        if (deviceId) {
          cy.visit(`http://localhost:3000/device-status/${deviceId}`);
          cy.get("h4").should("exist");
          cy.contains("Location:");
          cy.contains("Type:");
          cy.contains("Status:");
          cy.contains("Last Check:");
          cy.contains("Sensor Data:");
        }
      });
    });

    it("Displays device sensor history", () => {
      cy.request("http://localhost:8000/devices").then((response) => {
        const deviceId = response.body[0]?.id;
        if (deviceId) {
          cy.visit(`http://localhost:3000/device-status/${deviceId}`);
          cy.get('[data-testid="sensor-history-chart"]').should("exist");
        }
      });
    });

    it("Shows device alerts", () => {
      cy.request("http://localhost:8000/devices").then((response) => {
        const deviceId = response.body[0]?.id;
        if (deviceId) {
          cy.visit(`http://localhost:3000/device-status/${deviceId}`);
          cy.contains("Device Alerts");
          cy.get('[data-testid="device-alerts"]').should("exist");
        }
      });
    });
  });

  describe("Settings Page", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/settings");
      cy.wait("@getSettings");
    });

    it("Shows settings page", () => {
      cy.contains("System Settings");
      cy.get('[data-testid="settings-form"]').should("exist");
    });

    it("Displays threshold settings", () => {
      cy.contains("Threshold Settings");
      cy.get('[data-testid="threshold-settings"]').should("exist");
    });

    it("Displays notification settings", () => {
      cy.contains("Notification Settings");
      cy.get('[data-testid="notification-settings"]').should("exist");
    });

    it.skip("Updates threshold settings", () => {
      cy.get('[data-testid="temperature-warning"] input').clear().type("65");
      cy.get('[data-testid="temperature-critical"] input').clear().type("80");
      cy.contains("Save Settings").click();
      cy.contains("Settings saved successfully").should("be.visible");
    });

    it.skip("Toggles notification settings", () => {
      cy.get('[data-testid="email-notifications"]').click();
      cy.get('[data-testid="sms-notifications"]').click();
      cy.contains("Save Settings").click();
      cy.contains("Settings saved successfully").should("be.visible");
    });
  });

  describe.skip("Reports Page", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/reports");
      cy.wait([
        "@getDeviceMetrics",
        "@getAlertAnalysis",
        "@getMaintenanceAnalysis",
      ]);
    });

    it("Shows reports page", () => {
      cy.contains("Reports & Analytics");
      cy.contains("Device Metrics");
      cy.contains("Alert Analysis");
      cy.contains("Maintenance Analysis");
    });

    it("Displays device metrics report", () => {
      cy.contains("Device Metrics");
      cy.get('[data-testid="device-metrics-chart"]').should("exist");
    });

    it("Displays alert analysis report", () => {
      cy.contains("Alert Analysis");
      cy.get('[data-testid="alert-analysis-chart"]').should("exist");
    });

    it("Displays maintenance analysis report", () => {
      cy.contains("Maintenance Analysis");
      cy.get('[data-testid="maintenance-analysis-chart"]').should("exist");
    });

    it("Exports reports", () => {
      cy.get('[data-testid="export-button"]').click();
      cy.get('[data-testid="export-dialog"]').should("be.visible");
      cy.get('[data-testid="export-pdf"]').click();
      cy.get('[data-testid="export-dialog"]').should("not.be.visible");
    });
  });

  describe("Why Choose Us Page", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/why-choose-us");
    });

    it("Shows why choose us page", () => {
      cy.contains("Why Choose Our Predictive Maintenance Platform?");
      cy.get('[data-testid="why-choose-us-content"]').should("exist");
    });

    it("Displays features section", () => {
      cy.contains("Features");
      cy.get('[data-testid="features-section"]').should("exist");
    });

    it("Shows industry benefits", () => {
      cy.contains("Industry-Specific Benefits");
      cy.get('[data-testid="industry-benefits"]').should("exist");
      cy.contains("Manufacturing");
      cy.contains("Energy & Utilities");
      cy.contains("Healthcare");
      cy.contains("Transportation");
    });

    it("Displays testimonials", () => {
      cy.contains("What Our Clients Say");
      cy.get('[data-testid="testimonials"]').should("exist");
    });
  });

  describe("AI Chat Widget", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000");
      cy.wait(["@getAlerts", "@getDevices", "@getPredictions"]);
    });

    it("Opens chat widget", () => {
      cy.get('[data-testid="ai-chat-fab"]').click();
      cy.get('[data-testid="ai-chat-drawer"]').should("be.visible");
      cy.contains("AI Maintenance Assistant");
    });

    it("Sends a message and receives response", () => {
      cy.get('[data-testid="ai-chat-fab"]').click();
      cy.get('[data-testid="ai-chat-input"]').type("Hello{enter}");
      cy.wait("@aiChat");
      cy.contains("I'm your AI maintenance assistant").should("be.visible");
    });

    it.skip("Closes chat widget", () => {
      cy.get('[data-testid="ai-chat-fab"]').click();
      cy.get('[data-testid="ai-chat-drawer"]').should("be.visible");
      cy.get('[data-testid="close-chat-button"]').click();
      cy.get('[data-testid="ai-chat-drawer"]').should("not.be.visible");
    });

    it("Shows chat history", () => {
      cy.get('[data-testid="ai-chat-fab"]').click();
      cy.get('[data-testid="ai-chat-input"]').type("Test message{enter}");
      cy.wait("@aiChat");
      cy.get('[data-testid="chat-messages"]').should("contain", "Test message");
    });
  });

  describe("Responsive Design", () => {
    it("Works on mobile viewport", () => {
      cy.viewport(375, 667);
      cy.visit("http://localhost:3000");
      cy.wait(["@getAlerts", "@getDevices", "@getPredictions"]);
      cy.get('[aria-label="open drawer"]').should("be.visible");
      cy.get('[aria-label="open drawer"]').click();
      cy.get(".MuiDrawer-paper").should("be.visible");
    });

    it("Works on tablet viewport", () => {
      cy.viewport(768, 1024);
      cy.visit("http://localhost:3000");
      cy.wait(["@getAlerts", "@getDevices", "@getPredictions"]);
      cy.get('[data-testid="dashboard-content"]').should("be.visible");
    });
  });

  describe("Error Handling", () => {
    it("Handles API errors gracefully", () => {
      cy.intercept("GET", "http://localhost:8000/alerts", {
        statusCode: 500,
      }).as("getAlertsError");
      cy.visit("http://localhost:3000/alerts");
      cy.wait("@getAlertsError");
      cy.contains("Failed to fetch data").should("be.visible");
    });

    it.skip("Shows loading states", () => {
      cy.intercept("GET", "http://localhost:8000/alerts", { delay: 2000 }).as(
        "getAlertsSlow"
      );
      cy.visit("http://localhost:3000/alerts");
      cy.get('[data-testid="loading-spinner"]').should("be.visible");
      cy.wait("@getAlertsSlow");
      cy.get('[data-testid="loading-spinner"]').should("not.be.visible");
    });
  });

  describe("Data Validation", () => {
    it("Handles empty data gracefully", () => {
      cy.intercept("GET", "http://localhost:8000/alerts", { body: [] }).as(
        "getEmptyAlerts"
      );
      cy.visit("http://localhost:3000/alerts");
      cy.wait("@getEmptyAlerts");
      cy.contains("No alerts found").should("be.visible");
    });

    it("Handles malformed data gracefully", () => {
      cy.intercept("GET", "http://localhost:8000/alerts", {
        body: [{ invalid: "data" }],
      }).as("getMalformedAlerts");
      cy.visit("http://localhost:3000/alerts");
      cy.wait("@getMalformedAlerts");
      cy.get("table tbody tr").should("have.length", 0);
    });
  });
});

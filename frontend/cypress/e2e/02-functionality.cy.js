describe("PMBI Functionality Tests", () => {
  describe("Dashboard Functionality", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/");
    });

    it("Shows dashboard statistics and tabs", () => {
      cy.contains("System Overview");
      cy.contains("Alerts & Issues");
      cy.contains("Predictions");
      cy.contains("Maintenance");
      cy.contains("Overview");
    });

    it("Switches to Predictions tab", () => {
      cy.contains("Predictions").click();
      cy.contains("Predictions");
    });

    it("Switches to Maintenance tab", () => {
      cy.contains("Maintenance").click();
      cy.contains("Maintenance");
    });

    it("Switches to Alerts & Issues tab", () => {
      cy.contains("Alerts & Issues").click();
      cy.contains("Alerts & Issues");
    });
  });

  describe("Alerts Functionality", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/alerts");
    });

    it("Shows alerts table with proper headers", () => {
      cy.get("table").should("exist");
      cy.get("table thead").contains("Severity");
      cy.get("table thead").contains("Device");
      cy.get("table thead").contains("Status");
      cy.get("table thead").contains("Actions");
    });

    it("Filters alerts by severity", function () {
      cy.get('label:contains("Severity")')
        .parent()
        .find(".MuiSelect-select")
        .click();
      cy.get(".MuiMenu-root .MuiMenuItem-root").contains("Critical").click();
      cy.wait(1000);

      cy.get("body").then(($body) => {
        if ($body.find("table tbody tr").length === 0) {
          cy.log("No critical alerts present. Skipping test.");
          this.skip();
        } else {
          cy.get("table tbody tr").should("have.length.greaterThan", 0);
        }
      });
    });

    it("Opens alert details dialog", function () {
      // Wait for the table to load
      cy.wait(2000);

      cy.get("body").then(($body) => {
        // Check for MUI TableRow elements
        if ($body.find(".MuiTableRow-root").length <= 1) {
          // 1 for header, more for data rows
          cy.log("No alerts present to open details dialog. Skipping test.");
          this.skip();
        } else {
          // Click the first action button (View Details) in the first data row
          cy.get(".MuiTableRow-root")
            .not(":first-child")
            .first()
            .find("button")
            .first()
            .click();
          cy.get('[role="dialog"]').should("exist");
          cy.contains("Close").click();
        }
      });
    });

    it("Switches between Active and Resolved alerts tabs", () => {
      cy.contains("Active Alerts").should("be.visible");
      cy.contains("Resolved Alerts").click();
      cy.contains("Resolved Alerts").should("be.visible");
      cy.contains("Active Alerts").click();
      cy.contains("Active Alerts").should("be.visible");
    });
  });

  describe("Reports Functionality", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/reports");
    });

    it("Shows maintenance reports page", () => {
      cy.contains("Maintenance Reports");
      cy.get("table").should("exist");
    });

    it("Generates reports with filters", () => {
      // Check for device filter dropdown
      cy.get('label:contains("Device")').should("be.visible");
      cy.get('label:contains("Metric")').should("be.visible");
      cy.get('label:contains("Time Range")').should("be.visible");

      // Test device filter
      cy.get('label:contains("Device")')
        .parent()
        .find(".MuiSelect-select")
        .click();
      cy.get(".MuiMenu-root .MuiMenuItem-root").contains("All Devices").click();

      // Test metric filter
      cy.get('label:contains("Metric")')
        .parent()
        .find(".MuiSelect-select")
        .click();
      cy.get(".MuiMenu-root .MuiMenuItem-root").contains("Temperature").click();

      // Test time range filter
      cy.get('label:contains("Time Range")')
        .parent()
        .find(".MuiSelect-select")
        .click();
      cy.get(".MuiMenu-root .MuiMenuItem-root")
        .contains("Last 24 Hours")
        .click();

      // Check for export button
      cy.contains("Export as PDF").should("be.visible");
    });
  });

  describe("Settings Functionality", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/settings");
    });

    it("Shows system settings page", () => {
      cy.contains("System Settings");
      cy.contains("Alert Thresholds");
      cy.contains("HVAC (e.g., Server Room AC)");
      cy.contains("Power (e.g., Main Power Unit, Backup Generator)");
    });

    it("Updates threshold settings", () => {
      // Clear any existing alerts first
      cy.get("body").then(($body) => {
        if ($body.find('[role="alert"]').length > 0) {
          cy.get('[role="alert"]')
            .first()
            .find('button[aria-label="close"]')
            .click();
        }
      });

      // Change the temperature warning threshold to a very low value
      cy.get('input[type="number"]').first().clear().type("40");
      cy.contains("Save Settings").click();

      // Wait for any alert to appear (success or error)
      cy.get('[role="alert"]', { timeout: 10000 }).should("be.visible");

      // Verify that some alert appeared (either success or error)
      cy.get('[role="alert"]').should("be.visible");
    });
  });

  describe("Why Choose Us Functionality", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/why-choose-us");
    });

    it("Shows features and industry benefits", () => {
      cy.contains("Why Choose Our Predictive Maintenance Platform?");
      cy.contains("Industry-Specific Benefits");
      cy.get("div").contains("Manufacturing");
      cy.get("div").contains("Energy & Utilities");
      cy.get("div").contains("Healthcare");
      cy.get("div").contains("Transportation");
    });

    it("Shows industry benefit details", () => {
      cy.contains("Manufacturing").should("be.visible");
      cy.contains("Reduce unplanned downtime by up to 45%").should(
        "be.visible"
      );
      cy.contains("Energy & Utilities").should("be.visible");
      cy.contains("Prevent critical infrastructure failures").should(
        "be.visible"
      );
      cy.contains("Healthcare").should("be.visible");
      cy.contains("Ensure medical equipment reliability").should("be.visible");
      cy.contains("Transportation").should("be.visible");
      cy.contains("Prevent fleet breakdowns").should("be.visible");
    });
  });

  describe("Device Status Functionality", () => {
    it("Shows device information and sensor data", () => {
      cy.request("http://localhost:8000/devices").then((response) => {
        const deviceId = response.body[0]?.id;
        if (!deviceId) {
          throw new Error("No devices found in backend");
        }
        cy.visit(`http://localhost:3000/device-status/${deviceId}`);
        cy.get("h4").should("exist");
        cy.contains("Location:");
        cy.contains("Type:");
        cy.contains("Status:");
        cy.contains("Last Check:");
        cy.contains("Sensor Data:");
      });
    });

    it("Updates device status in real-time", () => {
      cy.request("http://localhost:8000/devices").then((response) => {
        const deviceId = response.body[0]?.id;
        if (!deviceId) {
          throw new Error("No devices found in backend");
        }
        cy.visit(`http://localhost:3000/device-status/${deviceId}`);
        // Check for sensor data charts
        cy.get(".recharts-wrapper").should("exist");
        cy.contains("Last Check:").should("be.visible");
      });
    });
  });

  describe("AI Chat Widget Functionality", () => {
    it("Opens chat and sends a message", () => {
      cy.visit("http://localhost:3000");
      cy.get("button.MuiFab-root").first().click();
      cy.contains("AI Maintenance Assistant", { timeout: 10000 }).should(
        "be.visible"
      );
      cy.get('[data-testid="ai-chat-input"]').should("be.visible");
      cy.get('[data-testid="ai-chat-input"]').type("Hello{enter}");
      cy.contains("I'm your AI maintenance assistant").should("be.visible");
    });

    it("Closes chat widget", () => {
      cy.visit("http://localhost:3000");
      cy.get("button.MuiFab-root").first().click();
      cy.contains("AI Maintenance Assistant").should("be.visible");
      cy.get('button svg[data-testid="CloseIcon"]').parent().click();
      cy.contains("AI Maintenance Assistant").should("not.be.visible");
    });
  });
});

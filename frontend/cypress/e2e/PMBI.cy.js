describe("PMBI App E2E", () => {
  it("Visits the React App and checks for title", () => {
    cy.visit("http://localhost:3000");
    cy.contains("Predictive Maintenance System");
  });

  describe("Navigation", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000");
    });
    it("Navigates to Dashboard", () => {
      cy.get('[data-testid="MenuIcon"]').click();
      cy.intercept("GET", "http://localhost:8000/dashboard/predictions").as("getPredictions");
      cy.contains("Dashboard").click();
      cy.wait("@getPredictions");
      cy.url().should("eq", "http://localhost:3000/");
      cy.contains("System Overview");
    });
    it("Navigates to Device Status", () => {
      cy.get('[data-testid="MenuIcon"]').click();
      cy.contains("Device Status").click();
      cy.url().should("include", "/device-status");
      cy.contains("Device Status");
    });
    it("Navigates to Alerts", () => {
      cy.get('[data-testid="MenuIcon"]').click();
      cy.intercept("GET", "http://localhost:8000/alerts").as("getAlerts");
      cy.contains("Alerts").click();
      cy.wait("@getAlerts");
      cy.url().should("include", "/alerts");
      cy.contains("Alert Management System");
    });
    it("Navigates to Reports", () => {
      cy.get('[data-testid="MenuIcon"]').click();
      cy.contains("Reports").click();
      cy.url().should("include", "/reports");
      cy.contains("Maintenance Reports");
    });
    it("Navigates to Settings", () => {
      cy.get('[data-testid="MenuIcon"]').click();
      cy.contains("Settings").click();
      cy.url().should("include", "/settings");
      cy.contains("System Settings");
    });
    it("Navigates to Why Choose Us", () => {
      cy.get('[data-testid="MenuIcon"]').click();
      cy.contains("Why Choose Us").click();
      cy.url().should("include", "/why-choose-us");
      cy.contains("Why Choose Our Predictive Maintenance Platform?");
    });
  });

  describe("Dashboard", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/");
    });
    it("Shows statistics and tabs", () => {
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
  });

  describe("Alerts", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/alerts");
    });
    it("Shows alerts table", () => {
      cy.get("table").should("exist");
      cy.get("table thead").contains("Severity");
      cy.get("table thead").contains("Device");
    });
    it("Filters alerts by severity", function () {
      // Click on the Severity select dropdown
      cy.get('label:contains("Severity")')
        .parent()
        .find(".MuiSelect-select")
        .click();
      // Select Critical from the dropdown
      cy.get(".MuiMenu-root .MuiMenuItem-root").contains("Critical").click();

      // Wait a moment for the filter to apply
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
      cy.get("body").then(($body) => {
        if ($body.find("table tbody tr").length === 0) {
          cy.log("No alerts present to open details dialog. Skipping test.");
          this.skip();
        } else {
          cy.get("table tbody tr").first().find("button").first().click();
          cy.get('[role="dialog"]').should("exist");
        }
      });
    });
  });
  describe("Alerts - Resolve Flow", () => {
    it("resolves an active alert and verifies it in resolved alerts", function () {
      cy.visit("http://localhost:3000/alerts");
      cy.contains("Active Alerts").click();
      cy.get("body").then(($body) => {
        if ($body.find("table tbody tr").length === 0) {
          cy.log("No active alerts present. Skipping resolve flow test.");
          this.skip();
        } else {
          let found = false;
          cy.get("table tbody tr").each(($row, idx, $rows) => {
            cy.wrap($row).within(() => {
              cy.get(".MuiChip-label").then(($chip) => {
                if (
                  $chip.text().includes("Unresolved") &&
                  $row.find(
                    'button[aria-label="Acknowledge"], button[title="Acknowledge"]'
                  ).length
                ) {
                  found = true;
                  cy.intercept(
                    "POST",
                    "http://localhost:8000/alerts/*/acknowledge"
                  ).as("acknowledgeAlert");
                  cy.get(
                    'button[aria-label="Acknowledge"], button[title="Acknowledge"]'
                  ).click();
                  cy.wait("@acknowledgeAlert", { timeout: 10000 })
                    .its("response.statusCode")
                    .should("eq", 200);
                  cy.get(".MuiDialog-root", { timeout: 20000 })
                    .should("be.visible")
                    .within(() => {
                      cy.get(
                        'textarea[placeholder="Enter resolution notes..."]',
                        {
                          timeout: 10000,
                        }
                      )
                        .should("be.visible")
                        .type("Resolved via E2E test");
                      cy.contains("Acknowledge & Resolve")
                        .should("not.be.disabled")
                        .click();
                    });
                  cy.contains("Alert successfully resolved", {
                    timeout: 10000,
                  }).should("be.visible");
                  cy.contains("Resolved Alerts").click();
                  cy.get("body").then(($body2) => {
                    if ($body2.find("table tbody tr").length === 0) {
                      cy.log(
                        "No resolved alerts present. Skipping resolved details check."
                      );
                      this.skip();
                    } else {
                      cy.get("table tbody tr").first().as("resolvedAlertRow");
                      cy.get("@resolvedAlertRow").within(() => {
                        cy.contains("Resolved");
                        cy.get(
                          'button[aria-label="View Details"], button[title="View Details"]'
                        ).click();
                      });
                      cy.get(".MuiDialog-root", { timeout: 20000 })
                        .should("be.visible")
                        .within(() => {
                          cy.contains("Resolved Alert Details").should(
                            "be.visible"
                          );
                          cy.contains("Resolution Notes").should("be.visible");
                          cy.contains("Resolved via E2E test").should(
                            "be.visible"
                          );
                          cy.contains("Close").click();
                        });
                    }
                  });
                  return false;
                }
              });
            });
          });
          cy.then(() => {
            if (!found) {
              cy.log(
                "No unresolved alert with acknowledge button found. Skipping resolve flow test."
              );
              this.skip();
            }
          });
        }
      });
    });
  });

  //  describe("AI Chat Widget", () => {
  //   it("Opens chat and sends a message", () => {
  //     cy.visit("http://localhost:3000");

  //     // Open the chat by clicking the FAB
  //     cy.get("button.MuiFab-root").first().click();

  //     // Wait for the drawer or header to appear before looking for the input
  //     cy.contains("AI Maintenance Assistant", { timeout: 10000 }).should("be.visible");

  //     // Now check the input is visible
  //     cy.get('[data-testid="ai-chat-input"]').should("be.visible");

  //     // Optionally test sending a message
  //     cy.get('[data-testid="ai-chat-input"]').type("Hello{enter}");

  //     // Confirm bot response is rendered
  //     cy.contains("I'm your AI maintenance assistant").should("be.visible");
  //   });
  // });

  describe("Why Choose Us", () => {
    it("Shows features and industry benefits", () => {
      cy.visit("http://localhost:3000/why-choose-us");
      cy.contains("Why Choose Our Predictive Maintenance Platform?");
      cy.contains("Industry-Specific Benefits");
      cy.get("div").contains("Manufacturing");
      cy.get("div").contains("Energy & Utilities");
      cy.get("div").contains("Healthcare");
      cy.get("div").contains("Transportation");
    });
  });

  describe("Device Info", () => {
    it("Shows device info for a real device", () => {
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
  });
});

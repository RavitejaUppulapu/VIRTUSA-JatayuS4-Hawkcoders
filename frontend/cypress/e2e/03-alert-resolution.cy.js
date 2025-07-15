describe("PMBI Alert Resolution Tests", () => {
  describe("Alert Acknowledgment and Resolution Flow", () => {
    it("Resolves an active alert and verifies it in resolved alerts", function () {
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

    it("Writes resolution notes and acknowledges alert", function () {
      cy.visit("http://localhost:3000/alerts");
      cy.contains("Active Alerts").click();

      cy.get("body").then(($body) => {
        if ($body.find("table tbody tr").length === 0) {
          cy.log("No active alerts present. Skipping resolution notes test.");
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
                        .clear()
                        .type(
                          "Detailed resolution notes: Issue was identified and fixed. Preventive measures implemented."
                        );
                      cy.contains("Acknowledge & Resolve")
                        .should("not.be.disabled")
                        .click();
                    });
                  cy.contains("Alert successfully resolved", {
                    timeout: 10000,
                  }).should("be.visible");
                  return false;
                }
              });
            });
          });
          cy.then(() => {
            if (!found) {
              cy.log(
                "No unresolved alert with acknowledge button found. Skipping resolution notes test."
              );
              this.skip();
            }
          });
        }
      });
    });
  });

  describe("Alert Status Verification", () => {
    it("Verifies alert status changes from Active to Resolved", function () {
      cy.visit("http://localhost:3000/alerts");

      // Check active alerts count
      cy.contains("Active Alerts").click();
      cy.get("table tbody tr").then(($rows) => {
        const activeCount = $rows.length;

        // Resolve an alert if available
        if (activeCount > 0) {
          cy.get("table tbody tr")
            .first()
            .within(() => {
              cy.get(".MuiChip-label").then(($chip) => {
                if ($chip.text().includes("Unresolved")) {
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
                        { timeout: 10000 }
                      )
                        .should("be.visible")
                        .type("Status verification test");
                      cy.contains("Acknowledge & Resolve")
                        .should("not.be.disabled")
                        .click();
                    });
                  cy.contains("Alert successfully resolved", {
                    timeout: 10000,
                  }).should("be.visible");

                  // Verify status change
                  cy.reload();
                  cy.contains("Active Alerts").click();
                  cy.get("table tbody tr").should(
                    "have.length",
                    activeCount - 1
                  );
                  cy.contains("Resolved Alerts").click();
                  cy.get("table tbody tr").should("have.length.greaterThan", 0);
                }
              });
            });
        }
      });
    });

    it("Verifies resolved alerts show correct information", function () {
      cy.visit("http://localhost:3000/alerts");
      cy.contains("Resolved Alerts").click();

      cy.get("body").then(($body) => {
        if ($body.find("table tbody tr").length === 0) {
          cy.log("No resolved alerts present. Skipping verification test.");
          this.skip();
        } else {
          cy.get("table tbody tr")
            .first()
            .within(() => {
              cy.contains("Resolved").should("be.visible");
              cy.get(
                'button[aria-label="View Details"], button[title="View Details"]'
              ).click();
            });
          cy.get(".MuiDialog-root", { timeout: 20000 })
            .should("be.visible")
            .within(() => {
              cy.contains("Resolved Alert Details").should("be.visible");
              cy.contains("Resolution Notes").should("be.visible");
              cy.contains("Resolution Date").should("be.visible");
              cy.contains("Close").click();
            });
        }
      });
    });
  });

  describe("Dashboard Alert Status Integration", () => {
    it("Checks alert status in dashboard overview", () => {
      cy.visit("http://localhost:3000/");
      cy.contains("Alerts & Issues").click();

      // Verify alert statistics are displayed
      cy.contains("Active Alerts").should("be.visible");
      cy.contains("Resolved Alerts").should("be.visible");
      cy.contains("Critical Alerts").should("be.visible");

      // Check if alert counts are numeric
      cy.get('[data-testid="active-alerts-count"]').should("be.visible");
      cy.get('[data-testid="resolved-alerts-count"]').should("be.visible");
    });

    it("Verifies alert status updates reflect in dashboard", function () {
      cy.visit("http://localhost:3000/alerts");
      cy.contains("Active Alerts").click();

      // Get initial active alerts count
      cy.get("table tbody tr").then(($rows) => {
        const initialActiveCount = $rows.length;

        if (initialActiveCount > 0) {
          // Resolve one alert
          cy.get("table tbody tr")
            .first()
            .within(() => {
              cy.get(".MuiChip-label").then(($chip) => {
                if ($chip.text().includes("Unresolved")) {
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
                        { timeout: 10000 }
                      )
                        .should("be.visible")
                        .type("Dashboard integration test");
                      cy.contains("Acknowledge & Resolve")
                        .should("not.be.disabled")
                        .click();
                    });
                  cy.contains("Alert successfully resolved", {
                    timeout: 10000,
                  }).should("be.visible");

                  // Check dashboard reflects the change
                  cy.visit("http://localhost:3000/");
                  cy.contains("Alerts & Issues").click();
                  cy.get('[data-testid="active-alerts-count"]').should(
                    "contain",
                    initialActiveCount - 1
                  );
                }
              });
            });
        }
      });
    });
  });
});

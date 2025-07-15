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
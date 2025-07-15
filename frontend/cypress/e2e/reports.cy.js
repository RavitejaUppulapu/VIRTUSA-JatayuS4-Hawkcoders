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
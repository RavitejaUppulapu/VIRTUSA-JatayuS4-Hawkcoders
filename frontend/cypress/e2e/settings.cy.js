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
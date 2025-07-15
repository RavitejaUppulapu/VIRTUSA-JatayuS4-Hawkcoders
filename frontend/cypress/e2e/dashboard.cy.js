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



describe("PMBI Navigation Tests", () => {
  beforeEach(() => {
    cy.visit("http://localhost:3000");
  });

  it("Visits the React App and checks for title", () => {
    cy.contains("Predictive maintenance for banking infrastructure");
  });

  it("Navigates to Dashboard", () => {
    cy.get('[data-testid="MenuIcon"]').click();
    cy.contains("Dashboard").click();
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
    // Open the navigation menu
    cy.get('[data-testid="MenuIcon"]').click();
    
    // Wait for the drawer to be visible
    cy.get('.MuiDrawer-paper').should('be.visible');
    
    // Try multiple approaches to click the Alerts link
    cy.get('body').then(($body) => {
      // First try to find the link by href
      if ($body.find('a[href="/alerts"]').length > 0) {
        cy.get('a[href="/alerts"]').click();
      } else {
        // Fallback to clicking by text within the drawer
        cy.get('.MuiDrawer-paper').contains("Alerts").click();
      }
    });
    
    // Wait for navigation to complete
    cy.url({ timeout: 10000 }).should("include", "/alerts");
    
    // Verify the page content loaded
    cy.contains("Alert Management System", { timeout: 10000 }).should("be.visible");
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

  it("Navigates to specific device status page", () => {
    const API_BASE_URL = Cypress.env("API_BASE_URL") || "http://localhost:8000";
    cy.request(`${API_BASE_URL}/devices`).then((response) => {
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

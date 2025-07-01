describe('Demo Test', () => {
  it('Visits the React App and checks for title', () => {
    cy.visit('http://localhost:3000');
    cy.contains('Predictive Maintenance System'); // Change 'PMBI' to any text you expect on your homepage
  });
});

describe('PMBI App Navigation and Features', () => {
  it('Loads Dashboard and shows statistics cards', () => {
    cy.visit('http://localhost:3000/');
    cy.contains('Dashboard');
    cy.contains('Alerts & Issues');
    cy.contains('Predictions');
    cy.contains('Maintenance');
    cy.contains('Overview');
  });

  it('Navigates to Device Status page', () => {
    cy.visit('http://localhost:3000/');
    cy.contains('Device Status').click();
    cy.url().should('include', '/device-status');
    cy.contains('Device Status');
  });

  it('Navigates to Alerts page and checks table', () => {
    cy.visit('http://localhost:3000/');
    cy.contains('Alerts').click();
    cy.url().should('include', '/alerts');
    cy.contains('Alert Management System');
    cy.get('table').should('exist');
    cy.get('table thead').contains('Severity');
    cy.get('table thead').contains('Device');
  });

  it('Filters alerts by severity', () => {
    cy.visit('http://localhost:3000/alerts');
    cy.contains('label', 'Severity').parent().click();
    cy.contains('li', 'Critical').click({ force: true });
    cy.get('table').should('exist');
    cy.wait(300)
    cy.get('table tbody tr').should('have.length.greaterThan', 0);

  });

  it('Opens alert details dialog', () => {
    cy.visit('http://localhost:3000/alerts');
    cy.get('table tbody tr').first().find('button').first().click();
    cy.get('[role="dialog"]').should('exist');
  });
});

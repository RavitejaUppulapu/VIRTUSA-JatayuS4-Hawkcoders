describe("AI Chat Widget Functionality", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000");
      // Wait for the page to load completely
      cy.wait(2000);
    });

    it("Opens chat and sends a message", () => {
      // Wait for the FAB button to be visible and click it
      cy.get('button.MuiFab-root').should('be.visible').first().click();
      
      // Wait for the chat drawer to open
      cy.contains("AI Maintenance Assistant", { timeout: 10000 }).should("be.visible");
      
      // Check if the input field is visible
      cy.get('[data-testid="ai-chat-input"]').should("be.visible");
      
      // Type and send a message
      cy.get('[data-testid="ai-chat-input"]').type("Hello{enter}");
      
      // Wait for the bot response
      cy.contains("I'm your AI maintenance assistant", { timeout: 15000 }).should("be.visible");
    });

    it("Closes chat widget", () => {
      // Wait for the FAB button to be visible and click it
      cy.get('button.MuiFab-root').should('be.visible').first().click();
      
      // Wait for the chat drawer to open
      cy.contains("AI Maintenance Assistant").should("be.visible");
      
      // Click the close button using the specific data-testid
      cy.get('[data-testid="chat-close-button"]').click();
      
      // Verify the chat is closed
      cy.contains("AI Maintenance Assistant").should("not.be.visible");
    });
  });
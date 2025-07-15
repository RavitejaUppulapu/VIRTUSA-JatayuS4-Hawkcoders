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
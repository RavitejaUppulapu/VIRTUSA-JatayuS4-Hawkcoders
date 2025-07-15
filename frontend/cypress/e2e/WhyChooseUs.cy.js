describe("Why Choose Us Functionality", () => {
    beforeEach(() => {
      cy.visit("http://localhost:3000/why-choose-us");
    });

    it("Shows features and industry benefits", () => {
      cy.contains("Why Choose Our Predictive Maintenance Platform?");
      cy.contains("Industry-Specific Benefits");
      cy.get("div").contains("Manufacturing");
      cy.get("div").contains("Energy & Utilities");
      cy.get("div").contains("Healthcare");
      cy.get("div").contains("Transportation");
    });

    it("Shows industry benefit details", () => {
      cy.contains("Manufacturing").should("be.visible");
      cy.contains("Reduce unplanned downtime by up to 45%").should(
        "be.visible"
      );
      cy.contains("Energy & Utilities").should("be.visible");
      cy.contains("Prevent critical infrastructure failures").should(
        "be.visible"
      );
      cy.contains("Healthcare").should("be.visible");
      cy.contains("Ensure medical equipment reliability").should("be.visible");
      cy.contains("Transportation").should("be.visible");
      cy.contains("Prevent fleet breakdowns").should("be.visible");
    });
  });
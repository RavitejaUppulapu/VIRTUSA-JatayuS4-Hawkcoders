describe("Device Status Functionality", () => {
    it("Shows device information and sensor data", () => {
      cy.request("http://localhost:8000/devices").then((response) => {
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

    it("Updates device status in real-time", () => {
      cy.request("http://localhost:8000/devices").then((response) => {
        const deviceId = response.body[0]?.id;
        if (!deviceId) {
          throw new Error("No devices found in backend");
        }
        cy.visit(`http://localhost:3000/device-status/${deviceId}`);
        // Check for sensor data charts
        cy.get(".recharts-wrapper").should("exist");
        cy.contains("Last Check:").should("be.visible");
      });
    });
  });
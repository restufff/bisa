// cypress/integration/automation_spec.js

describe('API Automation', () => {
  const bearerToken = Cypress.env('bearerToken');

  const hitAsset = () => {
    return cy.request({
      method: 'GET',
      url: '/moon/asset',
      headers: {
        Authorization: `Bearer ${bearerToken}`
      },
      failOnStatusCode: false // Allow handling of non-2xx status codes
    });
  };

  const hitClaim = () => {
    return cy.request({
      method: 'GET',
      url: '/moon/claim/farming',
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    });
  };

  const hitFarming = () => {
    return cy.request({
      method: 'GET',
      url: '/moon/farming',
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    });
  };

  const hitSignIn = () => {
    return cy.request({
      method: 'GET',
      url: '/moon/sign/in',
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    }).then((response) => {
      cy.log('Sign In Response:', response.body.msg);
      if (response.body.msg === "success") {
        // Proceed with the additional tasks if sign-in is successful
        hitVisitTask().then(() => {
          hitClaimTask();
        });
      }
    });
  };

  const hitVisitTask = () => {
    return cy.request({
      method: 'GET',
      url: '/moon/task/visit/ss',
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    }).then((response) => {
      cy.log('Visit Task Response:', response.body.msg);
    });
  };

  const hitClaimTask = () => {
    return cy.request({
      method: 'GET',
      url: '/moon/task/claim?taskId=1',
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    }).then((response) => {
      cy.log('Claim Task Response:', response.body.msg);
    });
  };

  const checkAsset = () => {
    hitAsset().then((response) => {
      const data = response.body.data;
      const farmingStartTime = data.farmingStartTime;
      const farmingEndTime = data.farmingEndTime;
      const systemTimestamp = data.systemTimestamp;
      const currentTime = new Date().getTime();

      cy.log(`Farming Start Time: ${farmingStartTime}, Farming End Time: ${farmingEndTime}`);

      // Hit the sign-in API and log the response
      hitSignIn();

      if (farmingStartTime === 0 && farmingEndTime === 0) {
        // Farming is not in progress, proceed with claim and farming
        hitClaim().then((claimResponse) => {
          cy.log('Claim Response:', claimResponse.body.msg);
          hitFarming().then((farmingResponse) => {
            cy.log('Farming Response:', farmingResponse.body.msg);
            cy.wait(360000); // Wait for 6 minutes
            checkAsset(); // Continue looping
          });
        });
      } else {
        // Farming is in progress
        const waitDuration = Math.max((farmingEndTime - systemTimestamp) - (currentTime - farmingStartTime), 100); // Wait for the remaining time or at least 0.1 seconds (100 milliseconds)

        cy.log(`Farming process ongoing, waiting for ${waitDuration / 1000} seconds before checking again...`);
        cy.wait(waitDuration); // Dynamic wait time
        checkAsset(); // Recursively check the asset API again
      }
    });
  };

  it('Automates the API flow indefinitely', () => {
    checkAsset(); // Start the infinite loop
  });
});

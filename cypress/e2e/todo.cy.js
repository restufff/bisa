// cypress/integration/automation_spec.js

describe('API Automation', () => {
  const baseUrl = Cypress.env('BASE_URL');
  const initData = Cypress.env('INIT_DATA');
  let bearerToken;

  const login = () => {
    return cy.request({
      method: 'POST',
      url: `${baseUrl}/pass/login`,
      body: `${initData}`
    });
  };

  const hitAsset = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/moon/asset`,
      headers: {
        Authorization: bearerToken
      },
      failOnStatusCode: false // Allow handling of non-2xx status codes
    });
  };

  const hitClaim = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/moon/claim/farming`,
      headers: {
        Authorization: bearerToken
      }
    });
  };

  const hitFarming = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/moon/farming`,
      headers: {
        Authorization: bearerToken
      }
    });
  };

  const hitSignIn = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/moon/sign/in`,
      headers: {
        Authorization: bearerToken
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
      url: `${baseUrl}/moon/task/visit/ss`,
      headers: {
        Authorization: bearerToken
      }
    }).then((response) => {
      cy.log('Visit Task Response:', response.body.msg);
    });
  };

  const hitClaimTask = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/moon/task/claim?taskId=1`,
      headers: {
        Authorization: bearerToken
      }
    }).then((response) => {
      cy.log('Claim Task Response:', response.body.msg);
    });
  };

  const checkAsset = () => {
    hitAsset().then((response) => {
      if (response.body.code === "400" && response.body.msg === "Login in, please!") {
        // Login required
        login().then((loginResponse) => {
          bearerToken = loginResponse.body.data.token;
          checkAsset(); // Retry the asset request after login
        });
      } else {
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
      }
    });
  };

  it('Automates the API flow indefinitely', () => {
    // Perform initial login to get the token
    login().then((response) => {
      bearerToken = response.body.data.token;
      checkAsset(); // Start the infinite loop
    });
  });
});

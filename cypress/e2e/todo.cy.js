// cypress/integration/automation_spec.js

describe('API Automation', () => {
  const baseUrl = 'https://moon.popp.club';
  let bearerToken;

  const login = () => {
    return cy.request({
      method: 'POST',
      url: `${baseUrl}/pass/login`,
      body: {
        initData: "query_id=AAHmkOAsAwAAAOaQ4Cx90c9s&user=%7B%22id%22%3A7195365606%2C%22first_name%22%3A%22Restu%22%2C%22last_name%22%3A%22Fauzi%20%F0%9F%9A%80PoPP%22%2C%22username%22%3A%22restufff%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1722965155&hash=7c82a1de217bf0eed5891ee0aaa0a252005b40b0595629b0970afaa627941c98",
        initDataUnSafe: {
          query_id: "AAHmkOAsAwAAAOaQ4Cx90c9s",
          user: {
            id: 7195365606,
            first_name: "Restu",
            last_name: "Fauzi 🚀PoPP",
            username: "restufff",
            language_code: "en",
            allows_write_to_pm: true
          },
          auth_date: "1722965155",
          hash: "7c82a1de217bf0eed5891ee0aaa0a252005b40b0595629b0970afaa627941c98"
        }
      }
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
      method: 'POST',
      url: `${baseUrl}/moon/sign/in`,
      headers: {
        Authorization: bearerToken
      }
    }).then((response) => {
      cy.log('Sign In Response:', response.body.msg);
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

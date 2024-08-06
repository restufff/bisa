// cypress/integration/automation_spec.js

describe('API Automation', () => {
  const baseUrl = 'https://moon.popp.club';
  let bearerToken;

  const login = () => {
    return cy.request({
      method: 'POST',
      url: `${baseUrl}/pass/login`,
      body: {
        initData: "query_id=AAHmkOAsAwAAAOaQ4CzBNy7l&user=%7B%22id%22%3A7195365606%2C%22first_name%22%3A%22Restu%22%2C%22last_name%22%3A%22Fauzi%20%F0%9F%9A%80PoPP%22%2C%22username%22%3A%22restufff%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%7D&auth_date=1722918469&hash=e62938d34914392502a27082fea06d9591a9976704e1e0660d3f68e35fcb88fe",
        initDataUnSafe: {
          query_id: "AAHmkOAsAwAAAOaQ4CzBNy7l",
          user: {
            id: 7195365606,
            first_name: "Restu",
            last_name: "Fauzi 🚀PoPP",
            username: "restufff",
            language_code: "en",
            allows_write_to_pm: true
          },
          auth_date: "1722918469",
          hash: "e62938d34914392502a27082fea06d9591a9976704e1e0660d3f68e35fcb88fe"
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

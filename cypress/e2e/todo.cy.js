describe('API Automation', () => {
  const baseUrl = 'https://moon.popp.club/moon';
  const bearerToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJSZXN0dSBGYXV6aSBcdUQ4M0VcdUREQjQtNzE5NTM2NTYwNiIsImlhdCI6MTcyMjU5MzIxOCwiZXhwIjoxNzIyNjc5NjE4fQ.f5HTnYxwiUMtQCyn1wH2WpHrMVU_2OPSi4xk5TAJev3C2XOof1T0ZExbgwdmQmhsUSQ7cHBeL_WNNbMg4NvR3Q';

  const waitTime = 360000; // 6 minutes in milliseconds
  const checkInterval = 500; // 0.5 seconds in milliseconds

  const hitAsset = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/asset`,
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    });
  };

  const hitClaim = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/claim/farming`,
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    });
  };

  const hitFarming = () => {
    return cy.request({
      method: 'GET',
      url: `${baseUrl}/farming`,
      headers: {
        Authorization: `Bearer ${bearerToken}`
      }
    });
  };

  const checkAssetRecursively = () => {
    return hitAsset().then((response) => {
      const data = response.body.data;

      // Ensure that 'data' is not null or undefined
      if (!data) {
        cy.log('Data is null or undefined, retrying...');
        return cy.wait(checkInterval).then(() => checkAssetRecursively());
      }

      const farmingStartTime = data.farmingStartTime;

      cy.log(`Farming Start Time: ${farmingStartTime}`);

      if (farmingStartTime === 0) {
        return cy.wrap(true); // Indicate that the condition is met
      } else {
        cy.log('Farming process ongoing, waiting before checking again...');
        return cy.wait(checkInterval).then(() => checkAssetRecursively()); // Continue checking
      }
    });
  };

  const automateApiFlow = () => {
    return checkAssetRecursively().then(() => {
      return hitClaim().then((claimResponse) => {
        cy.log('Claim Response Message:', claimResponse.body.msg);
        return hitFarming().then((farmingResponse) => {
          cy.log('Farming Response Message:', farmingResponse.body.msg);
          cy.log(`Waiting for ${waitTime / 60000} minutes...`);
          return cy.wait(waitTime).then(() => automateApiFlow()); // Wait and then call the function again for infinite loop
        });
      });
    });
  };

  it('Automates the API flow', () => {
    automateApiFlow();
  });
});

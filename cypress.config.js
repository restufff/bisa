const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://moon.popp.club',
    setupNodeEvents(on, config) {
      // Implement node event listeners here
    },
    env: {
      bearerToken: process.env.BEARER_TOKEN,
    },
  },
});

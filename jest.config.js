// jest.config.js
/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  verbose: true,
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*test.ts"
  ],
  testPathIgnorePatterns: ["/node_modules/"]
};

module.exports = config;
module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^google-apps-script$': '<rootDir>/__mocks__/google-apps-script.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
}; 
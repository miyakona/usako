module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/src/test/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/test/**',
    '!**/node_modules/**'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  setupFilesAfterEnv: ['../jest.setup.js']
}; 
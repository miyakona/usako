module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^google-apps-script$': '<rootDir>/__mocks__/google-apps-script.js',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
}; 
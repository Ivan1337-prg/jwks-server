export default {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageThreshold: { global: { lines: 80, branches: 80, functions: 80, statements: 80 } }
}

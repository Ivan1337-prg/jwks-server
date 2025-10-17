export default {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/server.js'],
  coverageThreshold: { global: { lines: 70, branches: 70, functions: 70, statements: 80 } }
}

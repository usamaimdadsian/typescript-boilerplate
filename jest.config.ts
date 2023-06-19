module.exports = {
    testEnvironment: 'node',
    testEnvironmentOptions: {
        NODE_ENV: 'test',
    },
    testMatch: ['**/*Test.ts'],
    restoreMocks: true,
    coveragePathIgnorePatterns: ['node_modules', 'dist/config', 'dist/app.js'],
    coverageReporters: ['text', 'lcov', 'clover', 'html'],
    transform: { '\\.ts$': ['ts-jest'] },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    }
};
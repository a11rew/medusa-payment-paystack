module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        isolatedModules: false,
      },
    ],
  },
  moduleFileExtensions: ["js", "ts", "json"],
  modulePathIgnorePatterns: ["dist", "node_modules"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**"],
};

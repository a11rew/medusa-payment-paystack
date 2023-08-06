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
  collectCoverage: true,
  collectCoverageFrom: ["src/**"],
};

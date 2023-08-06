module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.js?$": "./jest-transformer.js",
    "^.+\\.ts?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        isolatedModules: false,
      },
    ],
  },
  moduleFileExtensions: ["js", "jsx", "ts", "tsx", "json"],
  collectCoverage: true,
  collectCoverageFrom: ["src/**"],
};

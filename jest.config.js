module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.[jt]s?$": `./jest-transformer.js`,
  },
  collectCoverage: true,
  collectCoverageFrom: ["src/**"],
};

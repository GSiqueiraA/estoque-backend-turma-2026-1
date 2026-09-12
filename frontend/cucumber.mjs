export default {
  default: {
    paths: ["features/*.feature"],
    import: [
      "features/support/world.ts",
      "features/steps/CreateProductOutput.steps.ts",
    ],
  },
};

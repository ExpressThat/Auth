/** @type {import('@builder.io/mitosis').MitosisConfig} */
module.exports = {
  targets: ["react", "vue", "svelte", "angular", "solid", "preact", "qwik", "lit"],
  commonOptions: {
    typescript: true,
  },
  dest: "output",
  getTargetPath: ({ target }) => target,
  files: "src/**",
};

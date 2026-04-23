/**
 * Angular 19+ treats @Component as standalone by default. Mitosis doesn't emit
 * `standalone: false`, so NgModule declarations break. This plugin post-processes
 * the generated Angular code and injects `standalone: false` explicitly.
 *
 * @type {import('@builder.io/mitosis').MitosisPlugin}
 */
const angularStandaloneFalsePlugin = () => ({
  code: {
    post: (code) => code.replace(/@Component\(\{/g, "@Component({\n  standalone: false,"),
  },
});

/** @type {import('@builder.io/mitosis').MitosisConfig} */
module.exports = {
  targets: ["react", "vue", "svelte", "angular", "solid", "preact", "qwik"],
  commonOptions: {
    typescript: true,
  },
  options: {
    angular: {
      plugins: [angularStandaloneFalsePlugin],
    },
  },
  dest: "output",
  getTargetPath: ({ target }) => target,
  files: "src/**",
};

module.exports = {
  default: {
    require: ['tests/bdd/step_definitions/**/*.ts'],
    requireModule: ['tsx/cjs'],
    paths: ['tests/bdd/features/**/*.feature'],
    format: ['progress-bar', 'html:cucumber-report.html'],
    parallel: 0,
  },
}

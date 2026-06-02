module.exports = {
  default: {
    format: ['progress-bar', 'html:taskflow-bdd/cucumber-report.html'],
    parallel: 0,
  },
  auth: {
    paths: ['taskflow-bdd/features/auth.feature'],
    require: ['taskflow-bdd/features/step_definitions/auth.steps.js'],
  },
  projects: {
    paths: ['taskflow-bdd/features/projects.feature'],
    require: ['taskflow-bdd/features/step_definitions/projects.steps.js'],
  },
  tasks: {
    paths: ['taskflow-bdd/features/tasks.feature'],
    require: ['taskflow-bdd/features/step_definitions/tasks.steps.js'],
  },
};
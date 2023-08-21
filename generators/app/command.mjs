/**
 * @type {import('generator-jhipster').JHipsterCommandDefinition}
 */
const command = {
  options: {
    auditFramework: {
      description: 'Audit framework',
      type: String,
      scope: 'blueprint',
    },
    auditPage: {
      description: 'Generate client page',
      type: Boolean,
      scope: 'blueprint',
    },
    auditedEntities: {
      description: 'Entities to be audited',
      type: Array,
    },
  },
};

export default command;

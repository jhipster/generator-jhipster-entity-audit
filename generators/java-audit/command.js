import { asCommand } from 'generator-jhipster';

export default asCommand({
  configs: {
    auditFramework: {
      description: 'Audit framework',
      cli: {
        type: String,
      },
      prompt: {
        type: 'list',
        message: 'Choose which audit framework you would like to use.',
        default: 'custom',
      },
      choices: [
        {
          name: 'Custom JHipster auditing (works with SQL)',
          value: 'custom',
        },
        {
          name: 'Javers auditing framework (works with SQL and MongoDB)',
          value: 'javers',
        },
        {
          name: 'No auditing framework',
          value: 'no',
        },
      ],
      scope: 'blueprint',
    },
    auditUpdateType: {
      cli: {
        type: String,
      },
      prompt: generator => ({
        when: answers => (generator.initialRun || generator.options.askAnswered) && ['javers', 'custom'].includes(answers.auditFramework),
        type: 'list',
        name: 'auditUpdateType',
        message: 'Do you want to enable audit for all existing entities?',
        choices: [
          { name: 'Yes, update all', value: 'all' },
          { name: 'No, let me choose the entities to update', value: 'selected' },
        ],
        default: 'all',
      }),
      scope: 'generator',
    },
    auditedEntities: {
      description: 'Entities to be audited',
      cli: {
        type: Array,
      },
      prompt: gen => ({
        when: answers => answers.auditUpdateType === 'selected',
        type: 'checkbox',
        message: 'Please choose the entities to be audited',
        choices: gen.getExistingEntities().map(e => e.name),
        default: [],
      }),
      scope: 'generator',
    },
  },
});

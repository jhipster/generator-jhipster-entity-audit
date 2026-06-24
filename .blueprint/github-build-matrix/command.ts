import type { JHipsterCommandDefinition } from 'generator-jhipster';

const command = {
  configs: {
    samplesFolder: {
      description: 'Samples folder',
      cli: {
        type: String,
      },
      scope: 'generator',
    },
    samplesGroup: {
      description: 'Samples Group',
      argument: {
        type: String,
      },
      default: 'samples',
      scope: 'generator',
    },
  },
} as const satisfies JHipsterCommandDefinition;

export default command;

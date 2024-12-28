import { asCommand } from 'generator-jhipster';

export default asCommand({
  configs: {
    auditPage: {
      description: 'Generate client page',
      cli: {
        type: Boolean,
      },
      prompt: {
        type: 'confirm',
        message: 'Do you want to add an audit log page for entities?',
      },
      configure: gen => {
        gen.blueprintConfig.auditPage = (gen.blueprintConfig.auditFramework ?? 'no') !== 'no';
      },
      scope: 'blueprint',
    },
  },
});

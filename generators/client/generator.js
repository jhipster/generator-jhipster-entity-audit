import BaseApplicationGenerator from 'generator-jhipster/generators/client';

export default class extends BaseApplicationGenerator {
  constructor(args, opts, features) {
    super(args, opts, { ...features, queueCommandTasks: true, sbsBlueprint: true });
  }

  async beforeQueue() {
    await this.dependsOnBootstrap('client');
  }

  get [BaseApplicationGenerator.COMPOSING]() {
    return this.asComposingTaskGroup({
      async composeTask() {
        if (this.blueprintConfig.auditPage && ['angularX', 'angular'].includes(this.jhipsterConfigWithDefaults.clientFramework)) {
          await this.composeWithJHipster('jhipster-entity-audit:angular-audit');
        }
      },
    });
  }
}

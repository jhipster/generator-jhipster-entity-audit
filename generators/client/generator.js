import BaseApplicationGenerator from 'generator-jhipster/generators/client';

export default class extends BaseApplicationGenerator {
  constructor(args, opts, features) {
    super(args, opts, { ...features, sbsBlueprint: true });
  }

  async beforeQueue() {
    await this.dependsOnBootstrap('client');
  }

  get [BaseApplicationGenerator.COMPOSING]() {
    return this.asComposingTaskGroup({
      async composeTask() {
        const { applicationType, clientFramework } = this.jhipsterConfigWithDefaults;
        if (this.blueprintConfig.auditPage && clientFramework === 'angular' && applicationType !== 'microservice') {
          await this.composeWithJHipster('jhipster-entity-audit:angular-audit');
        }
      },
    });
  }
}

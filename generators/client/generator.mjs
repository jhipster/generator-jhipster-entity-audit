import ClientGenerator from 'generator-jhipster/generators/base-application';

export default class extends ClientGenerator {
  constructor(args, opts, features) {
    super(args, opts, { ...features, sbsBlueprint: true });
  }

  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [ClientGenerator.COMPOSING]() {
    return {
      async composeTask() {
        if (this.blueprintConfig.auditPage && ['angularX', 'angular'].includes(this.jhipsterConfig.clientFramework)) {
          await this.composeWithJHipster('jhipster-entity-audit:angular-audit');
        }
      },
    };
  }
}

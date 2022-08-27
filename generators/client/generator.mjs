import chalk from 'chalk';
import { GeneratorBaseEntities } from 'generator-jhipster';
import { PRIORITY_PREFIX, COMPOSING_PRIORITY } from 'generator-jhipster/esm/priorities';

export default class extends GeneratorBaseEntities {
  constructor(args, opts, features) {
    super(args, opts, { taskPrefix: PRIORITY_PREFIX, unique: 'namespace', ...features });

    if (this.options.help) return;

    if (!this.options.jhipsterContext) {
      throw new Error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprints entity-audit')}`);
    }

    this.sbsBlueprint = true;
  }

  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [COMPOSING_PRIORITY]() {
    return {
      async composeTask() {
        if (this.blueprintConfig.auditPage && ['angularX', 'angular'].includes(this.jhipsterConfig.clientFramework)) {
          await this.composeWithJHipster('jhipster-entity-audit:angular-audit');
        }
      },
    };
  }
}

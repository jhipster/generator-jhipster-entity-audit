import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';

export default class extends BaseApplicationGenerator {
  initialRun;
  auditedEntities;

  constructor(args, opts, features) {
    super(args, opts, { ...features, queueCommandTasks: true, sbsBlueprint: true });
  }

  get [BaseApplicationGenerator.INITIALIZING]() {
    return this.asInitializingTaskGroup({
      setInitialRun() {
        this.initialRun = this.blueprintConfig.auditFramework === undefined;
      },
    });
  }

  get [BaseApplicationGenerator.COMPOSING]() {
    return this.asComposingTaskGroup({
      async composingTask() {
        if (this.blueprintConfig.auditFramework && this.blueprintConfig.auditFramework !== 'no') {
          const auditedEntities = this.auditUpdateType === 'all' ? this.getExistingEntities().map(e => e.name) : this.auditedEntities;
          await this.composeWithJHipster('jhipster-entity-audit:java-audit', { generatorOptions: { auditedEntities } });
        }
      },
    });
  }
}

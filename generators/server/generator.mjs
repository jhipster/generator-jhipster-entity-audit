import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import command from './command.mjs';

export default class extends BaseApplicationGenerator {
  initialRun;

  constructor(args, opts, features) {
    super(args, opts, { ...features, sbsBlueprint: true });
  }

  get [BaseApplicationGenerator.INITIALIZING]() {
    return this.asInitializingTaskGroup({
      setInitialRun() {
        this.initialRun = this.blueprintConfig.auditFramework === undefined;
      },
      async initializeOptions() {
        this.parseJHipsterCommand(command);
      },
    });
  }

  get [BaseApplicationGenerator.PROMPTING]() {
    return this.asPromptingTaskGroup({
      async promptingTemplateTask() {
        await this.prompt(this.prepareQuestions(command.configs));
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

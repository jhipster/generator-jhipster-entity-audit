import chalk from 'chalk';
import AppGenerator from 'generator-jhipster/generators/base-application';

export default class extends AppGenerator {
  constructor(args, opts, features) {
    super(args, opts, features);

    if (this.options.help) return;

    if (!this.jhipsterContext) {
      throw new Error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprints entity-audit')}`);
    }

    this.sbsBlueprint = true;
  }

  get [AppGenerator.PROMPTING]() {
    return {
      async promptingTemplateTask() {
        const firstRun = this.blueprintConfig.auditFramework === undefined;
        await this.prompt(
          [
            {
              type: 'list',
              name: 'auditFramework',
              message: 'Choose which audit framework you would like to use.',
              choices: [
                {
                  name: 'Custom JHipster auditing (works with SQL)',
                  value: 'custom',
                },
                {
                  name: 'Javers auditing framework (works with SQL and MongoDB)',
                  value: 'javers',
                },
              ],
              default: 'custom',
            },
            {
              type: 'confirm',
              name: 'auditPage',
              message: 'Do you want to add an audit log page for entities?',
              default: true,
            },
          ],
          this.blueprintStorage,
        );
        if (firstRun && !this.options.auditedEntities) {
          const response = await this.prompt([
            {
              when: firstRun,
              type: 'list',
              name: 'updateType',
              message: 'Do you want to enable audit for all existing entities?',
              choices: [
                {
                  name: 'Yes, update all',
                  value: 'all',
                },
                {
                  name: 'No, let me choose the entities to update',
                  value: 'selected',
                },
              ],
              default: 'all',
            },
            {
              when: response => response.updateType !== 'all',
              type: 'checkbox',
              name: 'auditedEntities',
              message: 'Please choose the entities to be audited',
              choices: this.getExistingEntities().map(e => e.name),
              default: [],
            },
          ]);
          if (response.updateType === 'all') {
            response.auditedEntities = this.getExistingEntities().map(e => e.name);
          }
          this.auditedEntities = response.auditedEntities;
        }
      },
    };
  }

  get [AppGenerator.COMPOSING]() {
    return {
      async composingTask() {
        if (this.blueprintConfig.auditFramework && this.blueprintConfig.auditFramework !== 'no') {
          await this.composeWithJHipster('jhipster-entity-audit:java-audit', { auditedEntities: this.auditedEntities });
        }
      },
    };
  }
}

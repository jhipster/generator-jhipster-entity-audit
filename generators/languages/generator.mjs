import chalk from 'chalk';
import { existsSync } from 'fs';
import { GeneratorBaseEntities, constants } from 'generator-jhipster';
import { PRIORITY_PREFIX, PREPARING_PRIORITY, WRITING_PRIORITY } from 'generator-jhipster/esm/priorities';

const { CLIENT_MAIN_SRC_DIR } = constants;

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

  get [PREPARING_PRIORITY]() {
    return {
      async preparingTemplateTask({ application }) {
        application.webappDir = CLIENT_MAIN_SRC_DIR;
      },
    };
  }

  get [WRITING_PRIORITY]() {
    return {
      async writingTemplateTask({ application: { languages = [], webappDir } }) {
        const templates = languages.map(language => {
          const sourceLanguage = existsSync(`${this.templatePath()}/src/main/webapp/i18n/${language}/entity-audit.json`) ? language : 'en';
          return {
            file: `${webappDir}i18n/${sourceLanguage}/entity-audit.json`,
            renameTo: `${webappDir}i18n/${language}/entity-audit.json`,
            noEjs: true,
          };
        });
        if (templates.length > 0) {
          await this.writeFiles({
            sections: {
              customAudit: [
                {
                  templates,
                },
              ],
            },
            context: this,
          });
        }
      },
    };
  }
}

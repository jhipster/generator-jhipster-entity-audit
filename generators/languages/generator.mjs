import { existsSync } from 'fs';
import chalk from 'chalk';
import { TEMPLATES_MAIN_SOURCES_DIR } from 'generator-jhipster';
import LanguagesGenerator from 'generator-jhipster/generators/languages';

export default class extends LanguagesGenerator {
  constructor(args, opts, features) {
    super(args, opts, features);

    if (this.options.help) return;

    if (!this.jhipsterContext) {
      throw new Error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprints entity-audit')}`);
    }

    this.sbsBlueprint = true;
  }

  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [LanguagesGenerator.WRITING]() {
    return {
      async writingTemplateTask({ application: { languages = [], webappDir } }) {
        if (!webappDir) {
          throw new Error('webappDir is missing');
        }
        const templates = languages.map(language => {
          const sourceLanguage = existsSync(`${this.templatePath()}/${TEMPLATES_MAIN_SOURCES_DIR}i18n/${language}/entity-audit.json`)
            ? language
            : 'en';
          return {
            file: `${TEMPLATES_MAIN_SOURCES_DIR}i18n/${sourceLanguage}/entity-audit.json`,
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

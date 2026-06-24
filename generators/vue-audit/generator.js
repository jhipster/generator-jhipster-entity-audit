import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { clientApplicationTemplatesBlock } from 'generator-jhipster/generators/client/support';

export default class extends BaseApplicationGenerator {
  vueVersion;

  constructor(args, opts, features) {
    super(args, opts, { ...features, queueCommandTasks: true });
  }

  async beforeQueue() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.asPreparingTaskGroup({
      loadDependabot() {
        const {
          dependencies: { vue: vueVersion },
        } = this.fs.readJSON(this.templatePath('../resources/package.json'));
        this.vueVersion = vueVersion;
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      cleanup() {
        // 可选清理逻辑
      },

      writingTemplateTask({ application }) {
        return this.writeFiles({
          sections: {
            files: [
              {
                ...clientApplicationTemplatesBlock('admin/entity-audit/'),
                templates: [
                  'entity-audit-event.model.ts',
                  'entity-audit-modal.component.vue',
                  'entity-audit.component.vue',
                  'entity-audit.service.ts',
                ],
              },
            ],
          },
          context: application,
        });
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING]() {
    return this.asPostWritingTaskGroup({
      postWritingTemplateTask({ source }) {
        this.packageJson.merge({
          dependencies: {
            vue: this.vueVersion,
          },
        });

        if (this.options.skipMenu) return;

        source.addAdminRoute?.({
          route: 'entity-audit',
          modulePath: './entity-audit/entity-audit.component.vue',
          title: 'entityAudit.home.title',
          component: true,
        });

        source.addItemToAdminMenu?.({
          icon: 'list',
          route: 'admin/entity-audit',
          translationKey: 'global.menu.admin.entityAudit',
          name: 'Entity Audit',
        });
      },
    });
  }
}

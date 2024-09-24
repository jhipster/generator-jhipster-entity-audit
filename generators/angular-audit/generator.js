import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { clientApplicationTemplatesBlock } from 'generator-jhipster/generators/client/support';

export default class extends BaseApplicationGenerator {
  ngxDiff;

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
          dependencies: { 'ngx-diff': ngxDiff },
        } = this.fs.readJSON(this.templatePath('../resources/package.json'));
        this.ngxDiff = ngxDiff;
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      cleanup() {
        // this.removeFile(`${application.srcMainWebapp}app/admin/entity-audit/entity-audit-routing.module.ts`);
        // this.removeFile(`${application.srcMainWebapp}app/admin/entity-audit/entity-audit.module.ts`);
      },

      async writingTemplateTask({ application }) {
        await this.writeFiles({
          sections: {
            files: [
              {
                ...clientApplicationTemplatesBlock('admin/entity-audit/'),
                templates: [
                  'entity-audit-event.model.ts',
                  'entity-audit-modal.component.html',
                  'entity-audit-modal.component.ts',
                  'entity-audit.component.html',
                  'entity-audit.component.ts',
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
      async postWritingTemplateTask({ source }) {
        this.packageJson.merge({
          dependencies: {
            'ngx-diff': this.ngxDiff,
          },
        });
        if (this.options.skipMenu) return;
        source.addAdminRoute?.({
          route: 'entity-audit',
          modulePath: './entity-audit/entity-audit.component',
          title: 'entityAudit.home.title',
          component: true,
        });
        source.addItemToAdminMenu?.({
          icon: 'list-alt',
          route: 'admin/entity-audit',
          translationKey: 'global.menu.admin.entityAudit',
          name: 'Entity Audit',
        });
      },
    });
  }
}

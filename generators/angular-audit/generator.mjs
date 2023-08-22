import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { clientApplicationTemplatesBlock } from 'generator-jhipster/generators/client/support';

export default class extends BaseApplicationGenerator {
  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      cleanup() {
        // this.removeFile(`${application.srcMainWebapp}app/admin/entity-audit/entity-audit-routing.module.ts`);
        // this.removeFile(`${application.srcMainWebapp}app/admin/entity-audit/entity-audit.module.ts`);
      },

      async writingTemplateTask({ application }) {
        this.removeFile(`${application.srcMainWebapp}app/admin/entity-audit/entity-audit-routing.module.ts`);
        this.removeFile(`${application.srcMainWebapp}app/admin/entity-audit/entity-audit.module.ts`);

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
            'ngx-diff': '5.0.0',
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
          translationKey: 'entityAudit',
          name: 'Entity Audit',
        });
      },
    });
  }
}

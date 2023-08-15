import BaseGenerator from 'generator-jhipster/generators/base-application';

export default class extends BaseGenerator {
  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [BaseGenerator.PREPARING]() {
    return {
      async preparingTemplateTask({ application }) {
        application.webappDir = CLIENT_MAIN_SRC_DIR;
      },
    };
  }

  get [BaseGenerator.WRITING]() {
    return {
      async writingTemplateTask({ application }) {
        const { webappDir } = application;
        await this.writeFiles({
          sections: {
            files: [
              {
                path: `${webappDir}app/admin/entity-audit/`,
                templates: [
                  'entity-audit-event.model.ts',
                  'entity-audit-modal.component.html',
                  'entity-audit-modal.component.ts',
                  'entity-audit-routing.module.ts',
                  'entity-audit.component.html',
                  'entity-audit.component.ts',
                  'entity-audit.module.ts',
                  'entity-audit.service.ts',
                ],
              },
            ],
          },
          context: application,
        });
      },
    };
  }

  get [BaseGenerator.POST_WRITING]() {
    return {
      async postWritingTemplateTask({ application: { enableTranslation, clientFramework } }) {
        this.packageJson.merge({
          dependencies: {
            'ng-diff-match-patch': '3.0.1',
          },
        });
        if (this.options.skipMenu) return;
        this.addAdminRoute('entity-audit', './entity-audit/entity-audit.module', 'EntityAuditModule', 'EntityAudit');
        this.addElementToAdminMenu('admin/entity-audit', 'list-alt', enableTranslation, clientFramework, 'entityAudit', 'Entity Audit');
      },
    };
  }
}

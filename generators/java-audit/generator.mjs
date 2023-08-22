import BaseGenerator from 'generator-jhipster/generators/base-application';
import { javaMainPackageTemplatesBlock } from 'generator-jhipster/generators/java/support';

const COMMON_ATTRIBUTES = {
  // Hides form on create
  autoGenerate: true,
  // Disables form editing
  readonly: true,
  // Set an non nullable at db
  nullable: false,
  // Identify the audit field.
  auditField: true,
};

const ADDITIONAL_FIELDS = [
  {
    ...COMMON_ATTRIBUTES,
    fieldName: 'createdBy',
    fieldType: 'String',
    columnType: 'varchar(50)',
  },
  {
    ...COMMON_ATTRIBUTES,
    fieldName: 'createdDate',
    fieldType: 'Instant',
  },
  {
    ...COMMON_ATTRIBUTES,
    fieldName: 'lastModifiedBy',
    fieldType: 'String',
    columnType: 'varchar(50)',
  },
  {
    ...COMMON_ATTRIBUTES,
    fieldName: 'lastModifiedDate',
    fieldType: 'Instant',
  },
];

export default class extends BaseGenerator {
  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  get [BaseGenerator.COMPOSING]() {
    return {
      async composingTask() {
        if (this.blueprintConfig.auditFramework === 'javers') {
          await this.composeWithJHipster('jhipster-entity-audit:spring-boot-javers');
        } else if (this.blueprintConfig.auditFramework === 'custom') {
          await this.composeWithJHipster('jhipster-entity-audit:spring-boot-custom-audit');
        }
      },
    };
  }

  get [BaseGenerator.LOADING]() {
    return {
      prepareForTemplates({ application }) {
        const { auditFramework, auditPage } = this.blueprintConfig;
        application.auditFramework = auditFramework;
        application.auditPage = auditPage;
      },
    };
  }

  get [BaseGenerator.PREPARING]() {
    return {
      prepareForTemplates({ application }) {
        const { auditFramework } = application;
        application.auditFrameworkCustom = auditFramework === 'custom';
        application.auditFrameworkJavers = auditFramework === 'javers';
        application.auditFrameworkAny = auditFramework && auditFramework !== 'no';
      },
    };
  }

  get [BaseGenerator.CONFIGURING_EACH_ENTITY]() {
    return {
      async configureEntity({ entityName, entityConfig }) {
        const { auditedEntities = [] } = this.options;
        entityConfig.enableAudit = auditedEntities.includes(entityName) || entityConfig.enableAudit;
        if (!entityConfig.enableAudit) return;

        const fieldNames = entityConfig.fields.map(f => f.fieldName);
        const fieldsToAdd = ADDITIONAL_FIELDS.filter(f => !fieldNames.includes(f.fieldName)).map(f => ({ ...f }));
        entityConfig.fields = entityConfig.fields.concat(fieldsToAdd);
      },
    };
  }

  get [BaseGenerator.WRITING_ENTITIES]() {
    return this.asWritingEntitiesTaskGroup({
      async writingTemplateTask({ application, entities }) {
        await Promise.all(
          entities
            .filter(e => !e.builtIn && e.enableAudit)
            .map(e =>
              this.writeFiles({
                blocks: [
                  {
                    ...javaMainPackageTemplatesBlock(),
                    templates: ['domain/_PersistClass_.java.jhi.entity_audit'],
                  },
                ],
                context: { ...application, ...e },
              }),
            ),
        );
      },
    });
  }
}

import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
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

export default class extends BaseApplicationGenerator {
  async beforeQueue() {
    await this.dependsOnJHipster('java');
  }

  get [BaseApplicationGenerator.COMPOSING]() {
    return this.asComposingTaskGroup({
      async composingTask() {
        if (this.blueprintConfig.auditFramework === 'javers') {
          await this.composeWithJHipster('jhipster-entity-audit:spring-boot-javers');
        } else if (this.blueprintConfig.auditFramework === 'custom') {
          await this.composeWithJHipster('jhipster-entity-audit:spring-boot-custom-audit');
        }
      },
    });
  }

  get [BaseApplicationGenerator.LOADING]() {
    return this.asLoadingTaskGroup({
      prepareForTemplates({ application }) {
        const { auditFramework, auditPage } = this.blueprintConfig;
        application.auditFramework = auditFramework;
        application.auditPage = auditPage;
      },
    });
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.asPreparingTaskGroup({
      prepareForTemplates({ application }) {
        const { auditFramework } = application;
        application.auditFrameworkCustom = auditFramework === 'custom';
        application.auditFrameworkJavers = auditFramework === 'javers';
        application.auditFrameworkAny = auditFramework && auditFramework !== 'no';
      },
    });
  }

  get [BaseApplicationGenerator.CONFIGURING_EACH_ENTITY]() {
    return this.asConfiguringEachEntityTaskGroup({
      async configureEntity({ entityName, entityConfig }) {
        const { auditedEntities } = this.options;
        entityConfig.enableAudit = auditedEntities?.includes(entityName) || entityConfig.enableAudit;
        if (!entityConfig.enableAudit) return;

        const fieldNames = entityConfig.fields.map(f => f.fieldName);
        const fieldsToAdd = ADDITIONAL_FIELDS.filter(f => !fieldNames.includes(f.fieldName)).map(f => ({ ...f }));
        entityConfig.fields = entityConfig.fields.concat(fieldsToAdd);
      },
    });
  }

  get [BaseApplicationGenerator.PREPARING_EACH_ENTITY]() {
    return this.asConfiguringEachEntityTaskGroup({
      async configureEntity({ entity }) {
        if (entity.enableAudit) {
          entity.requiresPersistableImplementation = true;
        }
      },
    });
  }

  get [BaseApplicationGenerator.WRITING_ENTITIES]() {
    return this.asWritingEntitiesTaskGroup({
      async writingTemplateTask({ application, entities }) {
        await Promise.all(
          entities
            .filter(e => !e.builtIn && !e.skipServer && e.enableAudit)
            .map(e =>
              this.writeFiles({
                blocks: [
                  javaMainPackageTemplatesBlock({
                    relativePath: '_entityPackage_',
                    templates: ['domain/_persistClass_.java.jhi.entity_audit'],
                  }),
                ],
                context: { ...application, ...e },
              }),
            ),
        );
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING_ENTITIES]() {
    return {
      async postWritingEntitiesTask({ application: { mainJavaPackageDir, testJavaPackageDir }, entities }) {
        for (const entity of entities.filter(e => !e.builtIn && e.enableAudit)) {
          const { persistClass, entityPackage = '' } = entity;
          this.editFile(`${testJavaPackageDir}${entityPackage}/domain/${persistClass}Asserts.java`, contents =>
            contents
              .replace(
                `.satisfies(e -> assertThat(e.getLastModifiedBy()).as("check lastModifiedBy").isEqualTo(actual.getLastModifiedBy()))`,
                '',
              )
              .replace(
                '.satisfies(e -> assertThat(e.getLastModifiedDate()).as("check lastModifiedDate").isEqualTo(actual.getLastModifiedDate()))',
                '',
              ),
          );
        }
      },
    };
  }
}

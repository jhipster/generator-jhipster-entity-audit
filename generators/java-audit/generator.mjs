import chalk from 'chalk';
import BaseGenerator from 'generator-jhipster/generators/base-application';

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
        const { auditFramework, packageFolder } = application;
        application.auditFrameworkCustom = auditFramework === 'custom';
        application.auditFrameworkJavers = auditFramework === 'javers';
        application.auditFrameworkAny = auditFramework && auditFramework !== 'no';
        application.absolutePackageFolder = `${SERVER_MAIN_SRC_DIR}${packageFolder}/`;
        application.absolutePackageTestFolder = `${SERVER_TEST_SRC_DIR}${packageFolder}/`;
      },

      async prepare({ application }) {
        application.jhiTablePrefix = this.getTableName(application.jhiPrefix);
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

        // Add to sharedEntities for compatibility.
        if (this.configOptions.sharedEntities[entityName]) {
          this.configOptions.sharedEntities[entityName].fields.push(...fieldsToAdd);
        }
      },
    };
  }

  get [BaseGenerator.PREPARING_EACH_ENTITY]() {
    return {
      async prepareEntity({ application, entity }) {
        if (!entity.enableAudit) return;

        const { absolutePackageFolder, jhiPrefix } = application;
        const { entityPackage } = entity;

        entity.jhiTablePrefix = this.getTableName(jhiPrefix);
        entity.entityAbsoluteFolder = absolutePackageFolder;
        if (entityPackage) {
          entity.entityAbsoluteFolder = join(absolutePackageFolder, entityPackage);
        }
      },
    };
  }

  get [BaseGenerator.PREPARING_EACH_ENTITY_FIELD]() {
    return {
      async prepareEntity({ entity, field }) {
        if (!entity.enableAudit) return;

        if (field.blobContentTypeText) {
          field.javaFieldType = 'String';
        } else {
          field.javaFieldType = field.fieldType;
        }
      },
    };
  }

  get [BaseGenerator.WRITING_ENTITIES]() {
    return {
      async writingTemplateTask({ application, entities }) {
        await Promise.all(
          entities
            .filter(e => !e.builtIn && e.enableAudit)
            .map(e =>
              this.writeFiles({
                templates: [
                  {
                    sourceFile: `${SERVER_MAIN_SRC_DIR}package/domain/_entity_.java.jhi.entity_audit`,
                    destinationFile: ctx => `${ctx.entityAbsoluteFolder}domain/${ctx.persistClass}.java.jhi.entity_audit`,
                  },
                ],
                context: { ...application, ...e },
              }),
            ),
        );
      },
    };
  }
}

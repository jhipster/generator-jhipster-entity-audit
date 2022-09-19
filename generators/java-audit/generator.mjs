/* eslint-disable no-await-in-loop */
import { join } from 'path';
import { GeneratorBaseEntities, constants } from 'generator-jhipster';
import {
  PRIORITY_PREFIX,
  COMPOSING_PRIORITY,
  LOADING_PRIORITY,
  PREPARING_PRIORITY,
  CONFIGURING_EACH_ENTITY_PRIORITY,
  PREPARING_EACH_ENTITY_PRIORITY,
  PREPARING_EACH_ENTITY_FIELD_PRIORITY,
  WRITING_ENTITIES_PRIORITY,
} from 'generator-jhipster/esm/priorities';

const { SERVER_MAIN_SRC_DIR, SERVER_TEST_SRC_DIR } = constants;

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

/** @typedef {{ application: Object.<string, any> }} ApplicationTaskParam */

export default class JavaAuditBlueprint extends GeneratorBaseEntities {
  constructor(args, opts, features) {
    super(args, opts, { taskPrefix: PRIORITY_PREFIX, unique: 'namespace', ...features });
  }

  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

  /**
   * @returns {Record<string, (this: this): any>}
   */
  get [COMPOSING_PRIORITY]() {
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

  /**
   * @returns {Record<string, (this: this, { application: any }): any>}
   */
  get [LOADING_PRIORITY]() {
    return {
      prepareForTemplates({ application }) {
        const { auditFramework, auditPage } = this.blueprintConfig;
        application.auditFramework = auditFramework;
        application.auditPage = auditPage;
      },
    };
  }

  /** @typedef {(this: this, args: ApplicationTaskParam) => Promise<void>} ApplicationTask */
  /** @returns {Record<string, ApplicationTask>} */
  get [PREPARING_PRIORITY]() {
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

  /** @typedef {ApplicationTaskParam & { entityName: string, entityConfig: Object.<string, any>, entityStorage: import('yeoman-generator/lib/util/storage') }} ConfiguringEachEntityTaskParam */
  /** @typedef {(this: this, args: ConfiguringEachEntityTaskParam) => Promise<void>} ConfiguringEachEntityTask */
  /** @returns {Record<string, ConfiguringEachEntityTask>} */
  get [CONFIGURING_EACH_ENTITY_PRIORITY]() {
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

  /** @typedef {ApplicationTaskParam & { entity: Object.<string, any> }} ApplicationEachEntityTaskParam */
  /** @typedef {(this: this, args: ApplicationEachEntityTaskParam) => Promise<void>} PreparingEachEntityTask */
  /** @returns {Record<string, PreparingEachEntityTask): any>} */
  get [PREPARING_EACH_ENTITY_PRIORITY]() {
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

  /** @typedef {ApplicationTaskParam & { entity: Object.<string, any>, field: Object.<string, any> }} ApplicationEachEntityTaskParam */
  /** @typedef {(this: this, args: ApplicationEachEntityTaskParam) => Promise<void>} PreparingEachEntityTask */
  /** @returns {Record<string, PreparingEachEntityTask): any>} */
  get [PREPARING_EACH_ENTITY_FIELD_PRIORITY]() {
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

  /** @typedef {ApplicationTaskParam & { entities: Object.<string, any>[] }} WritingEntitiesTaskParam */
  /** @typedef {(this: this, args: WritingEntitiesTaskParam) => Promise<void>} WritingEntitiesTask */
  /** @returns {Record<string, WritingEntitiesTask>} */
  get [WRITING_ENTITIES_PRIORITY]() {
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
              })
            )
        );
      },
    };
  }
}

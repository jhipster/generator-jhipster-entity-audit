import { join } from 'path';
import { GeneratorBaseEntities, constants } from 'generator-jhipster';
import {
  PRIORITY_PREFIX,
  WRITING_PRIORITY,
  POST_WRITING_ENTITIES_PRIORITY,
  COMPOSING_PRIORITY,
  LOADING_PRIORITY,
  PREPARING_PRIORITY,
  CONFIGURING_EACH_ENTITY_PRIORITY,
  PREPARING_EACH_ENTITY_PRIORITY,
} from 'generator-jhipster/esm/priorities';

const { SERVER_MAIN_SRC_DIR, SERVER_MAIN_RES_DIR } = constants;

const COMMON_ATTRIBUTES = {
  // Hides form on create
  autoGenerate: true,
  // Disables form editing
  readonly: true,
  // Don't generate in entity
  javaInherited: true,
  // Set an non nullable at db
  nullable: false,
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

export default class extends GeneratorBaseEntities {
  constructor(args, opts, features) {
    super(args, opts, { taskPrefix: PRIORITY_PREFIX, unique: 'namespace', ...features });
  }

  async _postConstruct() {
    await this.dependsOnJHipster('bootstrap-application');
  }

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

  get [LOADING_PRIORITY]() {
    return {
      prepareForTemplates({ application }) {
        const { auditFramework, auditPage } = this.blueprintConfig;
        application.auditFramework = auditFramework;
        application.auditPage = auditPage;
      },
    };
  }

  get [PREPARING_PRIORITY]() {
    return {
      prepareForTemplates({ application }) {
        const { auditFramework, packageFolder } = application;
        application.auditFrameworkCustom = auditFramework === 'custom';
        application.auditFrameworkJavers = auditFramework === 'javers';
        application.auditFrameworkAny = auditFramework && auditFramework !== 'no';
        application.absolutePackageFolder = `${SERVER_MAIN_SRC_DIR}${packageFolder}/`;
      },

      async prepare({ application }) {
        application.jhiTablePrefix = this.getTableName(application.jhiPrefix);
      },
    };
  }

  get [CONFIGURING_EACH_ENTITY_PRIORITY]() {
    return {
      async configureEntity({ entityName, entityConfig }) {
        const { auditedEntities = [] } = this.options;
        if (auditedEntities.includes(entityName)) {
          entityConfig.enableAudit = true;
        }
        if (!entityConfig.enableAudit) return;

        const fieldNames = entityConfig.fields.map(f => f.fieldName);
        const fieldsToAdd = ADDITIONAL_FIELDS.filter(f => !fieldNames.includes(f.fieldName)).map(f => ({ ...f }));
        entityConfig.fields = entityConfig.fields.concat(fieldsToAdd);

        // Add to sharedEntities for compatibility.
        this.configOptions.sharedEntities[entityName].fields.push(...fieldsToAdd);
      },
    };
  }

  get [PREPARING_EACH_ENTITY_PRIORITY]() {
    return {
      async prepareEntity({ application, entity }) {
        if (!entity.enableAudit) return;

        entity.jhiTablePrefix = this.getTableName(application.jhiPrefix);
      },
    };
  }

  get [WRITING_PRIORITY]() {
    return {
      async writingTemplateTask({ application }) {
        await this.writeFiles({
          sections: {
            common: [
              {
                path: `${SERVER_MAIN_SRC_DIR}package/`,
                renameTo: (ctx, file) => `${ctx.absolutePackageFolder}/${file}`,
                templates: ['config/audit/EntityAuditAction.java', 'domain/EntityAuditEvent.java', 'service/dto/AbstractAuditingDTO.java'],
              },
            ],
          },
          context: application,
        });
      },
    };
  }

  get [POST_WRITING_ENTITIES_PRIORITY]() {
    return {
      async postWritingEntitiesTask({ application: { absolutePackageFolder, packageName }, entities }) {
        for (const entity of entities.filter(e => !e.builtIn && e.enableAudit)) {
          const { persistClass, restClass, entityPackage = '' } = entity;
          const entityAbsoluteFolder = join(absolutePackageFolder, entityPackage);
          this.editFile(`${entityAbsoluteFolder}/domain/${persistClass}.java`, contents => {
            if (entityPackage) {
              contents = contents.replace(
                /import java.io.Serializable;/,
                `import java.io.Serializable;
import ${packageName}.domain.AbstractAuditingEntity;`
              );
            }

            return contents.replace(
              new RegExp(`public class ${persistClass}`),
              `public class ${persistClass} extends AbstractAuditingEntity`
            );
          });

          if (entity.dto === 'mapstruct') {
            this.editFile(`${entityAbsoluteFolder}/service/dto/${restClass}.java`, contents => {
              if (entityPackage) {
                contents = contents.replace(
                  /import java.io.Serializable;/,
                  `import java.io.Serializable;
  import ${packageName}.service.dto.AbstractAuditingDTO;`
                );
              }

              return contents.replace(new RegExp(`public class ${restClass}`), `public class ${restClass} extends AbstractAuditingDTO`);
            });
          }
        }
      },
    };
  }
}

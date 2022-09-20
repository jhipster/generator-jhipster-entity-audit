import { GeneratorBaseEntities, constants } from 'generator-jhipster';
import {
  PRIORITY_PREFIX,
  CONFIGURING_PRIORITY,
  LOADING_PRIORITY,
  WRITING_PRIORITY,
  POST_WRITING_PRIORITY,
} from 'generator-jhipster/esm/priorities';

const { SERVER_MAIN_SRC_DIR, SERVER_MAIN_RES_DIR, SERVER_TEST_SRC_DIR } = constants;

export default class extends GeneratorBaseEntities {
  constructor(args, opts, features) {
    super(args, opts, { taskPrefix: PRIORITY_PREFIX, unique: 'namespace', ...features });
  }

  async _postConstruct() {
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
  }

  get [CONFIGURING_PRIORITY]() {
    return {
      async configuringTask() {
        if (!this.blueprintConfig.entityAuditEventChangelogDate) {
          this.blueprintConfig.entityAuditEventChangelogDate = this.dateFormatForLiquibase();
        }
      },
    };
  }

  get [LOADING_PRIORITY]() {
    return {
      async loadingTask({ application }) {
        application.entityAuditEventChangelogDate = this.blueprintConfig.entityAuditEventChangelogDate;
      },
    };
  }

  get [WRITING_PRIORITY]() {
    return {
      async writingTask({ application }) {
        await this.writeFiles({
          sections: {
            customAudit: [
              {
                path: `${SERVER_MAIN_SRC_DIR}package/`,
                renameTo: (ctx, file) => `${ctx.absolutePackageFolder}/${file}`,
                templates: [
                  'audit/AsyncEntityAuditEventWriter.java',
                  'audit/EntityAuditEventWriter.java',
                  'audit/EntityAuditEventListener.java',
                  'domain/EntityAuditEvent.java',
                  'domain/enumeration/EntityAuditAction.java',
                  'repository/EntityAuditEventRepository.java',
                ],
              },
              {
                path: `${SERVER_TEST_SRC_DIR}package/`,
                renameTo: (ctx, file) => `${ctx.absolutePackageTestFolder}/${file}`,
                templates: ['audit/TestEntityAuditEventWriter.java'],
              },
              {
                path: SERVER_MAIN_RES_DIR,
                templates: [
                  {
                    file: `config/liquibase/changelog/EntityAuditEvent.xml`,
                    renameTo: `config/liquibase/changelog/${application.entityAuditEventChangelogDate}_added_entity_EntityAuditEvent.xml`,
                  },
                ],
              },
              {
                condition: application.auditPage,
                path: `${SERVER_MAIN_SRC_DIR}/package/`,
                renameTo: (ctx, file) => `${ctx.absolutePackageFolder}/${file}`,
                templates: ['web/rest/EntityAuditResource.java'],
              },
            ],
          },
          context: application,
        });
      },
    };
  }

  get [POST_WRITING_PRIORITY]() {
    return {
      async customizeArchTest({ application: { absolutePackageTestFolder, packageName } }) {
        this.editFile(`${absolutePackageTestFolder}TechnicalStructureTest.java`, contents => {
          if (!contents.includes('.audit.EntityAuditEventListener;')) {
            contents = contents.replace(
              /import static com.tngtech.archunit.library.Architectures.layeredArchitecture;/,
              `import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.type;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import ${packageName}.audit.EntityAuditEventListener;
import ${packageName}.domain.AbstractAuditingEntity;
`
            );
          }
          if (!contents.includes('.ignoreDependency(type(AbstractAuditingEntity.class), type(EntityAuditEventListener.class))')) {
            contents = contents.replace(
              /.ignoreDependency/,
              `.ignoreDependency(resideInAPackage("${packageName}.audit"), alwaysTrue())
        .ignoreDependency(type(AbstractAuditingEntity.class), type(EntityAuditEventListener.class))
        .ignoreDependency`
            );
          }
          return contents;
        });
      },

      async customizeAbstractAuditingEntity({ application: { absolutePackageFolder, cacheProvider, packageName, packageFolder } }) {
        // add the new Listener to the 'AbstractAuditingEntity' class and add import if necessary
        this.editFile(`${absolutePackageFolder}domain/AbstractAuditingEntity.java`, contents => {
          if (!contents.includes(', EntityAuditEventListener.class')) {
            contents = contents.replace(/AuditingEntityListener.class/, '{AuditingEntityListener.class, EntityAuditEventListener.class}');
          }
          if (!contents.includes('.audit.EntityAuditEventListener;')) {
            contents = contents.replace(
              /import org.springframework.data.jpa.domain.support.AuditingEntityListener;/,
              `import org.springframework.data.jpa.domain.support.AuditingEntityListener;
  import ${packageName}.audit.EntityAuditEventListener;`
            );
          }
          return contents;
        });

        this.addEntryToCache(`${packageName}.domain.EntityAuditEvent.class.getName()`, packageFolder, cacheProvider);
      },

      async addLiquibaseChangelog({ application: { entityAuditEventChangelogDate } }) {
        this.addIncrementalChangelogToLiquibase(`${entityAuditEventChangelogDate}_added_entity_EntityAuditEvent`);
      },

      async addEntityAuditEventToCache({ application: { cacheProvider, packageName, packageFolder } }) {
        this.addEntryToCache(`${packageName}.domain.EntityAuditEvent.class.getName()`, packageFolder, cacheProvider);
      },
    };
  }
}

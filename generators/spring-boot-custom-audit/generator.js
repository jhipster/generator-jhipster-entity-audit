import { JAVA_MAIN_RESOURCES_DIR } from 'generator-jhipster';
import { javaMainPackageTemplatesBlock, javaTestPackageTemplatesBlock } from 'generator-jhipster/generators/java/support';
import BaseApplicationGenerator from 'generator-jhipster/generators/spring-boot';

export default class extends BaseApplicationGenerator {
  constructor(args, opts, features) {
    super(args, opts, { ...features, queueCommandTasks: true });
  }

  async beforeQueue() {
    await this.dependsOnBootstrap('java');
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
  }

  get [BaseApplicationGenerator.CONFIGURING]() {
    return this.asConfiguringTaskGroup({
      async configuringTask() {
        if (!this.blueprintConfig.entityAuditEventChangelogDate) {
          this.blueprintConfig.entityAuditEventChangelogDate = this.nextTimestamp();
        }
      },
    });
  }

  get [BaseApplicationGenerator.LOADING]() {
    return this.asLoadingTaskGroup({
      async loadingTask({ application }) {
        application.entityAuditEventChangelogDate = this.blueprintConfig.entityAuditEventChangelogDate;
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async writingTask({ application }) {
        await this.writeFiles({
          sections: {
            customAudit: [
              javaMainPackageTemplatesBlock({
                templates: [
                  'audit/AsyncEntityAuditEventWriter.java',
                  'audit/EntityAuditEventWriter.java',
                  'audit/EntityAuditEventListener.java',
                  'domain/EntityAuditEvent.java',
                  'domain/enumeration/EntityAuditAction.java',
                  'repository/EntityAuditEventRepository.java',
                ],
              }),
              javaTestPackageTemplatesBlock({
                templates: ['audit/TestEntityAuditEventWriter.java'],
              }),
              {
                path: JAVA_MAIN_RESOURCES_DIR,
                templates: [
                  {
                    file: `config/liquibase/changelog/EntityAuditEvent.xml`,
                    renameTo: `config/liquibase/changelog/${application.entityAuditEventChangelogDate}_added_entity_EntityAuditEvent.xml`,
                  },
                ],
              },
              javaMainPackageTemplatesBlock({
                condition: application.auditPage,
                templates: ['web/rest/EntityAuditResource.java'],
              }),
            ],
          },
          context: application,
        });
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING]() {
    return this.asPostWritingTaskGroup({
      async customizeArchTest({ application: { javaPackageTestDir, packageName }, source }) {
        source.editJavaFile(
          `${javaPackageTestDir}TechnicalStructureTest.java`,
          {
            staticImports: [
              'com.tngtech.archunit.core.domain.JavaClass.Predicates.type',
              'com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage',
            ],
            imports: [`${packageName}.audit.EntityAuditEventListener`, `${packageName}.domain.AbstractAuditingEntity`],
          },
          contents => {
            if (!contents.includes('.ignoreDependency(type(AbstractAuditingEntity.class), type(EntityAuditEventListener.class))')) {
              contents = contents.replace(
                /.ignoreDependency/,
                `.ignoreDependency(resideInAPackage("${packageName}.audit"), alwaysTrue())
        .ignoreDependency(type(AbstractAuditingEntity.class), type(EntityAuditEventListener.class))
        .ignoreDependency`,
              );
            }
            return contents;
          },
        );
      },

      async customizeAbstractAuditingEntity({ source, application: { javaPackageSrcDir, packageName } }) {
        // add the new Listener to the 'AbstractAuditingEntity' class and add import if necessary
        source.editJavaFile(
          `${javaPackageSrcDir}domain/AbstractAuditingEntity.java`,
          { imports: [`${packageName}.audit.EntityAuditEventListener`] },
          contents => {
            if (!contents.includes(', EntityAuditEventListener.class')) {
              contents = contents.replace(/AuditingEntityListener.class/, '{AuditingEntityListener.class, EntityAuditEventListener.class}');
            }
            return contents;
          },
        );

        source.addEntryToCache?.({ entry: `${packageName}.domain.EntityAuditEvent.class.getName()` });
      },

      async addLiquibaseChangelog({ source, application: { entityAuditEventChangelogDate } }) {
        source.addLiquibaseIncrementalChangelog?.({ changelogName: `${entityAuditEventChangelogDate}_added_entity_EntityAuditEvent` });
      },

      async addEntityAuditEventToCache({ source, application: { packageName } }) {
        source.addEntryToCache?.({ entry: `${packageName}.domain.EntityAuditEvent.class.getName()` });
      },
    });
  }
}

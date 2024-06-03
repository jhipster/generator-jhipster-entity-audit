import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import {
  javaMainPackageTemplatesBlock,
  javaTestPackageTemplatesBlock,
  javaMainResourceTemplatesBlock,
} from 'generator-jhipster/generators/java/support';

export default class extends BaseApplicationGenerator {
  async beforeQueue() {
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
    await this.dependsOnJHipster('spring-boot');
  }

  get [BaseApplicationGenerator.CONFIGURING]() {
    return this.asConfiguringTaskGroup({
      async configuringTask() {
        if (!this.blueprintConfig.entityAuditEventChangelogDate) {
          this.blueprintConfig.entityAuditEventChangelogDate = this.dateFormatForLiquibase();
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
              javaMainResourceTemplatesBlock({
                templates: [
                  {
                    file: `config/liquibase/changelog/EntityAuditEvent.xml`,
                    renameTo: `config/liquibase/changelog/${application.entityAuditEventChangelogDate}_added_entity_EntityAuditEvent.xml`,
                  },
                ],
              }),
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
      async customizeArchTest({ application: { testJavaPackageDir, packageName }, source }) {
        source.editJavaFile(
          `${testJavaPackageDir}TechnicalStructureTest.java`,
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

      async customizeAbstractAuditingEntity({ source, application: { mainJavaPackageDir, packageName } }) {
        // add the new Listener to the 'AbstractAuditingEntity' class and add import if necessary
        source.editJavaFile(
          `${mainJavaPackageDir}domain/AbstractAuditingEntity.java`,
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

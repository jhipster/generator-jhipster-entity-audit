import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import {
  javaMainPackageTemplatesBlock,
  javaTestPackageTemplatesBlock,
  javaMainResourceTemplatesBlock,
} from 'generator-jhipster/generators/java/support';

export default class extends BaseApplicationGenerator {
  async _postConstruct() {
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
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
              {
                ...javaMainPackageTemplatesBlock(),
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
                ...javaTestPackageTemplatesBlock(),
                templates: ['audit/TestEntityAuditEventWriter.java'],
              },
              {
                ...javaMainResourceTemplatesBlock(),
                templates: [
                  {
                    file: `config/liquibase/changelog/EntityAuditEvent.xml`,
                    renameTo: `config/liquibase/changelog/${application.entityAuditEventChangelogDate}_added_entity_EntityAuditEvent.xml`,
                  },
                ],
              },
              {
                condition: application.auditPage,
                ...javaMainPackageTemplatesBlock(),
                templates: ['web/rest/EntityAuditResource.java'],
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
      async customizeArchTest({ application: { testJavaPackageDir, packageName } }) {
        this.editFile(`${testJavaPackageDir}TechnicalStructureTest.java`, { ignoreNonExisting: true }, contents => {
          if (!contents.includes('.audit.EntityAuditEventListener;')) {
            contents = contents.replace(
              /import static com.tngtech.archunit.library.Architectures.layeredArchitecture;/,
              `import static com.tngtech.archunit.library.Architectures.layeredArchitecture;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.type;
import static com.tngtech.archunit.core.domain.JavaClass.Predicates.resideInAPackage;
import ${packageName}.audit.EntityAuditEventListener;
import ${packageName}.domain.AbstractAuditingEntity;
`,
            );
          }
          if (!contents.includes('.ignoreDependency(type(AbstractAuditingEntity.class), type(EntityAuditEventListener.class))')) {
            contents = contents.replace(
              /.ignoreDependency/,
              `.ignoreDependency(resideInAPackage("${packageName}.audit"), alwaysTrue())
        .ignoreDependency(type(AbstractAuditingEntity.class), type(EntityAuditEventListener.class))
        .ignoreDependency`,
            );
          }
          return contents;
        });
      },

      async customizeAbstractAuditingEntity({ source, application: { mainJavaPackageDir, packageName } }) {
        // add the new Listener to the 'AbstractAuditingEntity' class and add import if necessary
        this.editFile(`${mainJavaPackageDir}domain/AbstractAuditingEntity.java`, { ignoreNonExisting: true }, contents => {
          if (!contents.includes(', EntityAuditEventListener.class')) {
            contents = contents.replace(/AuditingEntityListener.class/, '{AuditingEntityListener.class, EntityAuditEventListener.class}');
          }
          if (!contents.includes('.audit.EntityAuditEventListener;')) {
            contents = contents.replace(
              /import org.springframework.data.jpa.domain.support.AuditingEntityListener;/,
              `import org.springframework.data.jpa.domain.support.AuditingEntityListener;
  import ${packageName}.audit.EntityAuditEventListener;`,
            );
          }
          return contents;
        });

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

import { join } from 'path';
import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { javaMainPackageTemplatesBlock } from 'generator-jhipster/generators/java/support';
import { getPomVersionProperties } from 'generator-jhipster/generators/server/support';

export default class extends BaseApplicationGenerator {
  async beforeQueue() {
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.asPreparingTaskGroup({
      async defaultTask({ application }) {
        const pomFile = this.readTemplate(this.templatePath('../resources/pom.xml'));
        // TODO use application.javaDependencies
        const versions = getPomVersionProperties(pomFile);
        application.javaDependencies = this.prepareDependencies({
          ...application.javaDependencies,
          ...versions,
        });
      },
    });
  }

  get [BaseApplicationGenerator.DEFAULT]() {
    return this.asDefaultTaskGroup({
      async defaultTask({ application, entities }) {
        application.auditedEntities = entities.map(e => e.persistClass);
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async writingTemplateTask({ application }) {
        await this.writeFiles({
          sections: {
            javersAudit: [
              {
                ...javaMainPackageTemplatesBlock(),
                templates: ['config/audit/JaversAuthorProvider.java'],
              },
              {
                condition: application.auditPage,
                ...javaMainPackageTemplatesBlock(),
                templates: [
                  'web/rest/JaversEntityAuditResource.java',
                  'web/rest/dto/EntityAuditEvent.java',
                  'web/rest/dto/EntityAuditAction.java',
                ],
              },
            ],
          },
          context: application,
        });
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING]() {
    return {
      async postWritingTemplateTask({
        source,
        application: { mainJavaPackageDir, buildToolMaven, buildToolGradle, databaseTypeSql, databaseTypeMongodb, javaDependencies },
      }) {
        // add annotations for Javers to ignore fields in 'AbstractAuditingEntity' class
        this.editFile(`${mainJavaPackageDir}domain/AbstractAuditingEntity.java`, { ignoreNonExisting: true }, contents =>
          contents
            .replace(
              /import org.springframework.data.annotation.CreatedBy;/,
              `import org.springframework.data.annotation.CreatedBy;
import org.javers.core.metamodel.annotation.DiffIgnore;`,
            )
            .replace(/(\s*)@MappedSuperclass/, '$1@MappedSuperclass$1@DiffIgnore')
            .replace(/\s*import com.fasterxml.jackson.annotation.JsonIgnore;/, ''),
        );

        // add required third party dependencies
        if (buildToolMaven) {
          if (databaseTypeMongodb) {
            source.addMavenDependency?.({
              groupId: 'org.javers',
              artifactId: 'javers-spring-boot-starter-mongo',
              version: javaDependencies['javers-core'],
            });
          } else if (databaseTypeSql) {
            source.addMavenDependency?.({
              groupId: 'org.javers',
              artifactId: 'javers-spring-boot-starter-sql',
              version: javaDependencies['javers-core'],
            });
          }
        } else if (buildToolGradle) {
          if (databaseTypeMongodb) {
            source.addGradleDependency?.({
              groupId: 'org.javers',
              artifactId: 'javers-spring-boot-starter-mongo',
              version: javaDependencies['javers-core'],
              scope: 'implementation',
            });
          } else if (databaseTypeSql) {
            source.addGradleDependency?.({
              groupId: 'org.javers',
              artifactId: 'javers-spring-boot-starter-sql',
              version: javaDependencies['javers-core'],
              scope: 'implementation',
            });
          }
        }
      },
    };
  }

  get [BaseApplicationGenerator.POST_WRITING_ENTITIES]() {
    return {
      async postWritingEntitiesTask({ application: { mainJavaPackageDir }, entities }) {
        for (const entity of entities.filter(e => !e.builtIn && e.enableAudit)) {
          const { persistClass, entityPackage = '' } = entity;
          const entityAbsoluteFolder = join(mainJavaPackageDir, entityPackage);
          this.editFile(`${entityAbsoluteFolder}repository/${persistClass}Repository.java`, contents =>
            contents
              .replace(
                /@Repository/,
                `@Repository
@JaversSpringDataAuditable`,
              )
              .replace(
                /import org.springframework.stereotype.Repository;/,
                `import org.javers.spring.annotation.JaversSpringDataAuditable;
import org.springframework.stereotype.Repository;`,
              ),
          );
        }
      },
    };
  }
}

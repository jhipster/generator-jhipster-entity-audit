import { join } from 'path';
import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { javaMainPackageTemplatesBlock } from 'generator-jhipster/generators/java/support';
import { getPomVersionProperties } from 'generator-jhipster/generators/server/support';

export default class extends BaseApplicationGenerator {
  async beforeQueue() {
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
    await this.dependsOnJHipster('spring-boot');
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.asPreparingTaskGroup({
      async defaultTask({ application }) {
        const pomFile = this.readTemplate(this.templatePath('../resources/pom.xml'));
        const versions = getPomVersionProperties(pomFile);
        Object.assign(application.javaDependencies, this.prepareDependencies(versions));
      },
    });
  }

  get [BaseApplicationGenerator.DEFAULT]() {
    return this.asDefaultTaskGroup({
      async defaultTask({ application, entities }) {
        application.auditedEntities = entities
          .filter(e => e.enableAudit)
          .map(e => `${e.entityPackage ? `${e.entityPackage}.` : ''}domain.${e.persistClass}`);
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async writingTemplateTask({ application }) {
        await this.writeFiles({
          blocks: [
            javaMainPackageTemplatesBlock({
              templates: ['config/audit/JaversAuthorProvider.java'],
            }),
            javaMainPackageTemplatesBlock({
              condition: application.auditPage,
              templates: [
                'web/rest/JaversEntityAuditResource.java',
                'web/rest/dto/EntityAuditEvent.java',
                'web/rest/dto/EntityAuditAction.java',
              ],
            }),
          ],
          context: application,
        });
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING]() {
    return this.asPostWritingTaskGroup({
      async postWritingTemplateTask({ source, application }) {
        const { mainJavaPackageDir, databaseTypeSql, databaseTypeMongodb, javaDependencies } = application;
        // add annotations for Javers to ignore fields in 'AbstractAuditingEntity' class
        source.editJavaFile(
          `${mainJavaPackageDir}domain/AbstractAuditingEntity.java`,
          { annotations: [{ annotation: 'DiffIgnore', package: 'org.javers.core.metamodel.annotation' }] },
          contents => contents.replace(/\s*import com.fasterxml.jackson.annotation.JsonIgnore;/, ''),
        );

        // add required third party dependencies
        if (databaseTypeMongodb || databaseTypeSql) {
          source.addJavaDefinition?.({
            dependencies: [
              {
                groupId: 'org.javers',
                artifactId: databaseTypeMongodb ? 'javers-spring-boot-starter-mongo' : 'javers-spring-boot-starter-sql',
                version: javaDependencies['javers-core'],
              },
            ],
          });
        }
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING_ENTITIES]() {
    return this.asPostWritingEntitiesTaskGroup({
      async postWritingEntitiesTask({ application: { mainJavaPackageDir }, entities, source }) {
        for (const entity of entities.filter(e => !e.builtIn && e.enableAudit)) {
          const { persistClass, entityPackage = '' } = entity;
          const entityAbsoluteFolder = join(mainJavaPackageDir, entityPackage);
          source.editJavaFile(`${entityAbsoluteFolder}repository/${persistClass}Repository.java`, {
            annotations: [{ annotation: 'JaversSpringDataAuditable', package: 'org.javers.spring.annotation' }],
          });
        }
      },
    });
  }
}

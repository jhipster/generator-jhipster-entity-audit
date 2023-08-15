import { join } from 'path';
import BaseGenerator from 'generator-jhipster/generators/base-application';
import { JAVERS_VERSION } from './constants.mjs';

export default class extends BaseGenerator {
  async _postConstruct() {
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
  }

  get [BaseGenerator.DEFAULT]() {
    return {
      async defaultTask({ application, entities }) {
        application.auditedEntities = entities.map(e => e.persistClass);
      },
    };
  }

  get [BaseGenerator.WRITING]() {
    return {
      async writingTemplateTask({ application }) {
        await this.writeFiles({
          sections: {
            javersAudit: [
              {
                path: `${SERVER_MAIN_SRC_DIR}package/`,
                renameTo: (ctx, file) => `${ctx.absolutePackageFolder}/${file}`,
                templates: ['config/audit/JaversAuthorProvider.java'],
              },
              {
                condition: application.auditPage,
                path: `${SERVER_MAIN_SRC_DIR}package/`,
                renameTo: (ctx, file) => `${ctx.absolutePackageFolder}/${file}`,
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
    };
  }

  get [BaseGenerator.POST_WRITING]() {
    return {
      async postWritingTemplateTask({
        application: { absolutePackageFolder, buildToolMaven, buildToolGradle, databaseTypeSql, databaseTypeMongodb },
      }) {
        // add annotations for Javers to ignore fields in 'AbstractAuditingEntity' class
        this.editFile(`${absolutePackageFolder}domain/AbstractAuditingEntity.java`, contents =>
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
            this.addMavenDependency('org.javers', 'javers-spring-boot-starter-mongo', JAVERS_VERSION);
          } else if (databaseTypeSql) {
            this.addMavenDependency('org.javers', 'javers-spring-boot-starter-sql', JAVERS_VERSION);
          }
        } else if (buildToolGradle) {
          if (databaseTypeMongodb) {
            this.addGradleDependency('implementation', 'org.javers', 'javers-spring-boot-starter-mongo', JAVERS_VERSION);
          } else if (databaseTypeSql) {
            this.addGradleDependency('implementation', 'org.javers', 'javers-spring-boot-starter-sql', JAVERS_VERSION);
          }
        }
      },
    };
  }

  get [BaseGenerator.POST_WRITING_ENTITIES]() {
    return {
      async postWritingEntitiesTask({ application: { absolutePackageFolder }, entities }) {
        for (const entity of entities.filter(e => !e.builtIn && e.enableAudit)) {
          const { persistClass, entityPackage = '' } = entity;
          const entityAbsoluteFolder = join(absolutePackageFolder, entityPackage);
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

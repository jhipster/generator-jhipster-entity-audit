/* eslint-disable class-methods-use-this */
import { GeneratorBaseEntities, constants } from 'generator-jhipster';
import {
  PRIORITY_PREFIX,
  DEFAULT_PRIORITY,
  WRITING_PRIORITY,
  POST_WRITING_PRIORITY,
  POST_WRITING_ENTITIES_PRIORITY,
} from 'generator-jhipster/esm/priorities';
import { join } from 'path';

import { JAVERS_VERSION } from './constants.mjs';

const { SERVER_MAIN_SRC_DIR } = constants;

export default class extends GeneratorBaseEntities {
  constructor(args, opts, features) {
    super(args, opts, { taskPrefix: PRIORITY_PREFIX, unique: 'namespace', ...features });
  }

  async _postConstruct() {
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
  }

  get [DEFAULT_PRIORITY]() {
    return {
      async defaultTask({ application, entities }) {
        application.auditedEntities = entities.map(e => e.persistClass);
      },
    };
  }

  get [WRITING_PRIORITY]() {
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
                templates: ['web/rest/JaversEntityAuditResource.java'],
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
      async postWritingTemplateTask({
        application: { absolutePackageFolder, buildToolMaven, buildToolGradle, databaseTypeSql, databaseTypeMongodb },
      }) {
        // add annotations for Javers to ignore fields in 'AbstractAuditingEntity' class
        this.editFile(`${absolutePackageFolder}domain/AbstractAuditingEntity.java`, contents =>
          contents
            .replace(
              /import org.springframework.data.annotation.CreatedBy;/,
              `import org.springframework.data.annotation.CreatedBy;
import org.javers.core.metamodel.annotation.DiffIgnore;`
            )
            .replace(/(\s*)@MappedSuperclass/, '$1@MappedSuperclass$1@DiffIgnore')
            .replace(/\s*import com.fasterxml.jackson.annotation.JsonIgnore;/, '')
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
            this.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-mongo', JAVERS_VERSION);
          } else if (databaseTypeSql) {
            this.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-sql', JAVERS_VERSION);
          }
        }
      },
    };
  }

  get [POST_WRITING_ENTITIES_PRIORITY]() {
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
@JaversSpringDataAuditable`
              )
              .replace(
                /import org.springframework.stereotype.Repository;/,
                `import org.javers.spring.annotation.JaversSpringDataAuditable;
import org.springframework.stereotype.Repository;`
              )
          );
        }
      },
    };
  }
}

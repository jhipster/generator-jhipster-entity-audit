import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { javaMainPackageTemplatesBlock } from 'generator-jhipster/generators/java/support';
import { getPomVersionProperties } from 'generator-jhipster/generators/server/support';
import { createNeedleCallback, normalizeLineEndings } from 'generator-jhipster/generators/base/support';

export default class extends BaseApplicationGenerator {
  constructor(args, opts, features) {
    super(args, opts, { ...features, queueCommandTasks: true });
  }

  async beforeQueue() {
    await this.dependsOnBootstrapApplicationBase();
    await this.dependsOnJHipster('jhipster-entity-audit:java-audit');
  }

  get [BaseApplicationGenerator.PREPARING]() {
    return this.asPreparingTaskGroup({
      async defaultTask({ application }) {
        const pomFile = this.readTemplate(this.templatePath('../resources/pom.xml'));
        const versions = getPomVersionProperties(pomFile);
        Object.assign(application.javaDependencies, this.prepareDependencies(versions));
      },
      async addNeedle({ application, source }) {
        source.addEntityToAuditedEntityEnum = ({ entityAuditEnumValue, entityAbsoluteClass, entityAuditEventType }) => {
          const enumValueDeclaration = `${entityAuditEnumValue}( ${entityAbsoluteClass}.class, "${entityAuditEventType}" )`;
          this.editFile(
            `${application.javaPackageSrcDir}config/audit/AuditedEntity.java`,
            createNeedleCallback({
              needle: 'add-audited-entities',
              contentToAdd: (content, { indentPrefix }) => {
                const isCrLr = content.includes('\r\n');
                if (isCrLr) {
                  content = normalizeLineEndings(content, '\n');
                }
                const needleValuePrefix = `AuditedEntity {\n`;
                const needleValueSeparator = `,\n`;
                const needleValueSuffix = `;\n`;

                const needleIndex = content.indexOf('    // jhipster-needle-add-audited-entities');
                let beforeContent = content.substring(0, needleIndex);
                // Drop extra line ending if it exists, can be caused by prettier formatting
                beforeContent = beforeContent.endsWith('\n\n') ? beforeContent.slice(0, -1) : beforeContent;
                const afterContent = content.substring(needleIndex);

                if (!beforeContent.includes(needleValuePrefix) || !beforeContent.endsWith(needleValueSuffix)) {
                  throw new Error(`Invalid file content ${beforeContent}, expected to contain ${needleValuePrefix}`);
                }
                const beforeNeedleContentIndex = beforeContent.lastIndexOf(needleValuePrefix) + needleValuePrefix.length;
                const beforeNeedleContent = beforeContent.substring(0, beforeNeedleContentIndex);
                let needleContent = beforeContent.substring(beforeNeedleContentIndex).slice(0, -needleValueSuffix.length);
                needleContent = needleContent.trim() ? needleContent : '';

                const newContent = `${beforeNeedleContent}${needleContent}${needleContent ? needleValueSeparator : ''}${indentPrefix}${enumValueDeclaration}${needleValueSuffix}${afterContent}`;
                return isCrLr ? normalizeLineEndings(newContent, '\r\n') : newContent;
              },
              contentToCheck: enumValueDeclaration,
            }),
          );
        };
      },
    });
  }

  get [BaseApplicationGenerator.POST_PREPARING_EACH_ENTITY]() {
    return this.asPostPreparingEachEntityTaskGroup({
      async postPreparingEntityTask({ entity }) {
        if (!entity.enableAudit) return;
        const { snakeCase } = this._;
        entity.entityAuditEnumValue = `${entity.entityPackage ? `${snakeCase(entity.entityPackage).toUpperCase()}_` : ''}${entity.name.toUpperCase()}`;
        entity.entityAuditEventType = `${entity.entityPackage ? `${entity.entityPackage}.` : ''}domain.${entity.persistClass}`;
      },
    });
  }

  get [BaseApplicationGenerator.DEFAULT]() {
    return this.asDefaultTaskGroup({
      async defaultTask({ application, entities }) {
        application.auditedEntities = entities.map(e => e.entityAuditEventType).filter(Boolean);
      },
    });
  }

  get [BaseApplicationGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async writingTemplateTask({ application }) {
        await this.writeFiles({
          blocks: [
            javaMainPackageTemplatesBlock({
              templates: ['config/audit/JaversAuthorProvider.java', 'config/audit/AuditedEntity.java'],
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

        this.editFile(`${application.srcTestJava}${application.packageFolder}TechnicalStructureTest.java`, content => {
          const applicationProperties = `${application.packageName}.config.ApplicationProperties.class`;
          const auditedEntityEnum = `${application.packageName}.config.audit.AuditedEntity.class`;
          if (!content.includes(auditedEntityEnum)) {
            content = content.replace(
              applicationProperties,
              `${auditedEntityEnum},
            ${applicationProperties}`,
            );
          }
          return content;
        });

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
      async postWritingEntitiesTask({ application: { srcMainJava }, entities, source }) {
        for (const entity of entities.filter(e => !e.builtIn && e.enableAudit)) {
          const { persistClass, entityAbsoluteFolder } = entity;
          source.editJavaFile(`${srcMainJava}${entityAbsoluteFolder}/repository/${persistClass}Repository.java`, {
            annotations: [{ annotation: 'JaversSpringDataAuditable', package: 'org.javers.spring.annotation' }],
          });

          source.addEntityToAuditedEntityEnum({
            entityAuditEnumValue: entity.entityAuditEnumValue,
            entityAbsoluteClass: entity.entityAbsoluteClass,
            entityAuditEventType: entity.entityAuditEventType,
          });
        }
      },
    });
  }
}

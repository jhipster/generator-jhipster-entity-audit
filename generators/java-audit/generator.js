import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import { javaMainPackageTemplatesBlock } from 'generator-jhipster/generators/java/support';

const COMMON_ATTRIBUTES = {
  // Hides form on create
  autoGenerate: true,
  // Disables form editing
  readonly: true,
  // Set an non nullable at db
  nullable: false,
  // Identify the audit field.
  auditField: true,
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

export default class extends BaseApplicationGenerator {
  auditUpdateType;
  auditedEntities;

  constructor(args, opts, features) {
    super(args, opts, { ...features, queueCommandTasks: true });
  }

  async beforeQueue() {
    await this.dependsOnJHipster('jhipster:java:domain');
  }

  get [BaseApplicationGenerator.INITIALIZING]() {
    return this.asInitializingTaskGroup({
      setInitialRun() {
        this.initialRun = this.blueprintConfig.auditFramework === undefined;
      },
    });
  }

  get [BaseApplicationGenerator.COMPOSING]() {
    return this.asComposingTaskGroup({
      async composingTask() {
        if (this.blueprintConfig.auditFramework === 'javers') {
          await this.composeWithJHipster('jhipster-entity-audit:spring-boot-javers');
        } else if (this.blueprintConfig.auditFramework === 'custom') {
          await this.composeWithJHipster('jhipster-entity-audit:spring-boot-custom-audit');
        } else {
          this.cancelCancellableTasks();
        }
      },
    });
  }

  get [BaseApplicationGenerator.CONFIGURING_EACH_ENTITY]() {
    return this.asConfiguringEachEntityTaskGroup({
      async configureEntity({ entityName, entityConfig, entityStorage }) {
        entityConfig.annotations ??= {};
        if (entityConfig.enableAudit !== undefined) {
          entityConfig.annotations.enableAudit ??= entityConfig.enableAudit;
          delete entityConfig.enableAudit;
        }
        if (entityConfig.annotations.enableAudit === undefined) {
          const auditedEntities = this.auditUpdateType === 'all' ? this.getExistingEntities().map(e => e.name) : this.auditedEntities;
          entityConfig.annotations.enableAudit = auditedEntities?.includes(entityName);
          entityStorage.save();
        }
        if (!entityConfig.annotations.enableAudit) return;

        const fieldNames = entityConfig.fields.map(f => f.fieldName);
        const fieldsToAdd = ADDITIONAL_FIELDS.filter(f => !fieldNames.includes(f.fieldName)).map(f => ({ ...f }));
        entityConfig.fields = entityConfig.fields.concat(fieldsToAdd);
      },
    });
  }

  get [BaseApplicationGenerator.PREPARING_EACH_ENTITY]() {
    return this.asConfiguringEachEntityTaskGroup({
      async configureEntity({ entity }) {
        if (entity.enableAudit) {
          entity.requiresPersistableImplementation = true;
        }
      },
    });
  }

  get [BaseApplicationGenerator.WRITING_ENTITIES]() {
    return this.asWritingEntitiesTaskGroup({
      async writingTemplateTask({ application, entities }) {
        await Promise.all(
          entities
            .filter(e => !e.builtIn && !e.skipServer && e.enableAudit)
            .map(e =>
              this.writeFiles({
                blocks: [
                  javaMainPackageTemplatesBlock({
                    relativePath: '_entityPackage_',
                    templates: ['domain/_persistClass_.java.jhi.entity_audit'],
                  }),
                ],
                context: { ...application, ...e },
              }),
            ),
        );
      },
    });
  }

  get [BaseApplicationGenerator.POST_WRITING_ENTITIES]() {
    return {
      async postWritingEntitiesTask({ application: { testJavaPackageDir }, entities }) {
        for (const entity of entities.filter(e => !e.builtIn && e.enableAudit)) {
          const { persistClass, entityPackage = '' } = entity;
          this.editFile(`${testJavaPackageDir}${entityPackage}/domain/${persistClass}Asserts.java`, contents =>
            contents
              .replace(
                `.satisfies(a -> assertThat(a.getLastModifiedBy()).as("check lastModifiedBy").isEqualTo(expected.getLastModifiedBy()))`,
                '',
              )
              .replace(
                '.satisfies(a -> assertThat(a.getLastModifiedDate()).as("check lastModifiedDate").isEqualTo(expected.getLastModifiedDate()))',
                '.satisfies(a -> assertThat(a.getLastModifiedDate()).as("check lastModifiedDate").isAfter(expected.getLastModifiedDate()))',
              ),
          );
        }
      },
    };
  }

  shouldAskForPrompts() {
    return this.initialRun;
  }
}

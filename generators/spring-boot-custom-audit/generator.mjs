import { GeneratorBaseEntities, constants } from 'generator-jhipster';
import {
  PRIORITY_PREFIX,
  CONFIGURING_PRIORITY,
  LOADING_PRIORITY,
  WRITING_PRIORITY,
  POST_WRITING_PRIORITY,
} from 'generator-jhipster/esm/priorities';

const { SERVER_MAIN_SRC_DIR, SERVER_MAIN_RES_DIR } = constants;

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
                  'config/EntityAuditEventConfig.java',
                  'domain/EntityAuditEventListener.java',
                  'service/AsyncEntityAuditEventWriter.java',
                  'repository/EntityAuditEventRepository.java',
                ],
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
      async postWritingTemplateTask({
        application: { absolutePackageFolder, cacheProvider, packageName, packageFolder, entityAuditEventChangelogDate },
      }) {
        // collect files to copy
        this.addIncrementalChangelogToLiquibase(`${entityAuditEventChangelogDate}_added_entity_EntityAuditEvent`);

        // add the new Listener to the 'AbstractAuditingEntity' class and add import
        this.editFile(`${absolutePackageFolder}domain/AbstractAuditingEntity.java`, contents => {
          return contents.replace(/AuditingEntityListener.class/, '{AuditingEntityListener.class, EntityAuditEventListener.class}').replace(
            /import org.springframework.data.jpa.domain.support.AuditingEntityListener;/,
            `import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import ${packageName}.domain.EntityAuditEventListener;`
          );
        });

        this.addEntryToCache(`${packageName}.domain.EntityAuditEvent.class.getName()`, packageFolder, cacheProvider);
      },
    };
  }
}

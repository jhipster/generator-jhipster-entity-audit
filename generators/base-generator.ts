import type { JHipsterCommandDefinition } from 'generator-jhipster';
import BaseApplicationGenerator from 'generator-jhipster/generators/base-application';
import type { Source as LiquibaseSource } from 'generator-jhipster/generators/liquibase';
import type {
  Application as SpringBootApplication,
  Config as SpringBootConfig,
  Entity as SpringBootEntity,
  Options as SpringBootOptions,
  Source as SpringBootSource,
} from 'generator-jhipster/generators/spring-boot';

type EntityAuditBlueprintConfig = {
  auditFramework?: string;
  auditPage?: boolean;
  entityAuditEventChangelogDate?: string;
};

type EntityAuditEntity = SpringBootEntity & {
  enableAudit: boolean;
  entityAuditEventType?: string;
  entityAuditEnumValue?: string;
  requiresPersistableImplementation?: boolean;
};

export type EntityAuditApplication = SpringBootApplication<EntityAuditEntity> & {
  entityAuditEventChangelogDate: string;
  auditedEntities: string[];
};

type EntityAuditSource = SpringBootSource &
  LiquibaseSource & {
    addEntityToAuditedEntityEnum: (param: {
      entityAuditEnumValue?: string;
      entityAbsoluteClass: string;
      entityAuditEventType?: string;
    }) => void;
  };

export class EntityAuditApplicationGenerator extends BaseApplicationGenerator<
  EntityAuditEntity,
  EntityAuditApplication,
  SpringBootConfig,
  SpringBootOptions,
  EntityAuditSource
> {
  initialRun?: boolean;
  declare blueprintConfig: EntityAuditBlueprintConfig;
}

export const asCommand = <const Def extends JHipsterCommandDefinition<EntityAuditApplicationGenerator>>(command: Def): Def => command;

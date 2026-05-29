import { beforeAll, describe, expect, it } from 'vitest';

import { createTestHelpers, typedResult } from 'generator-jhipster/testing';

import type Generator from './generator.js';

const helpers = createTestHelpers<Generator>({
  importMeta: import.meta,
  defaultGenerator: 'jhipster-entity-audit:spring-boot-javers',
});
const result = typedResult<Generator>();

describe('SubGenerator spring-boot-javers of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .runDefault()
        .withJHipsterConfig()
        .withOptions({
          ignoreNeedlesError: true,
          auditFramework: 'javers',
        })
        .withJHipsterGenerators()
        .withConfiguredBlueprint()
        .withBlueprintConfig({});
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });
  describe('should generate AuditedEntity', () => {
    beforeAll(async function () {
      await helpers
        .runJDL(
          `
application {
  config {
    baseName jhipster
    blueprints [generator-jhipster-entity-audit]
  }

  config(generator-jhipster-entity-audit) {
    auditFramework javers
  }

  entities *
}

@EnableAudit
@ChangelogDate("20200101000100")
entity CamelCase {
  name String required
}

@EnableAudit
@EntityPackage("custom")
@ChangelogDate("20200101000200")
entity WithEntityPackage {
  name String required
}
`,
        )
        .withConfiguredBlueprint();
    });

    it('generate .yo-rc.json content', () => {
      expect(result.getSnapshot('**/.yo-rc.json')).toMatchSnapshot();
    });
    it('generate AuditedEntity content', () => {
      expect(result.getSnapshot('**/AuditedEntity.java')).toMatchSnapshot();
    });
  });
});

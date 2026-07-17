import { beforeAll, describe, expect, it } from 'vitest';

import { createTestHelpers, typedResult } from 'generator-jhipster/testing';

import type Generator from './generator.js';

const helpers = createTestHelpers<Generator>({
  importMeta: import.meta,
  defaultGenerator: 'jhipster-entity-audit:java-audit',
});
const result = typedResult<Generator>();

describe('SubGenerator java-audit of entity-audit JHipster blueprint', () => {
  for (const auditFramework of [null, 'javers', 'custom']) {
    describe(`run using auditFramework ${auditFramework}`, () => {
      beforeAll(async function () {
        await helpers
          .runDefault()
          .withJHipsterConfig({}, [
            {
              name: 'Audited',
              enableAudit: true,
              fields: [
                {
                  fieldName: 'name',
                  fieldType: 'String',
                },
              ],
            } as any,
          ])
          .withOptions({
            creationTimestamp: '2022-01-01',
            ignoreNeedlesError: true,
            auditFramework,
          })
          .withJHipsterGenerators()
          .withConfiguredBlueprint();
      });

      it('should succeed', () => {
        expect(result.getStateSnapshot()).toMatchSnapshot();
      });

      if (auditFramework) {
        it('entities should extend AbstractAuditingEntity', () => {
          result.assertFileContent('src/main/java/com/mycompany/myapp/domain/Audited.java', ' AbstractAuditingEntity<');
        });
      } else {
        it('entities should not extend AbstractAuditingEntity', () => {
          result.assertNoFileContent('src/main/java/com/mycompany/myapp/domain/Audited.java', ' AbstractAuditingEntity<');
        });
      }
    });
  }
});

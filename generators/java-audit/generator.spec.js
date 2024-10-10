import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

const SUB_GENERATOR = 'java-audit';
const SUB_GENERATOR_NAMESPACE = `jhipster-entity-audit:${SUB_GENERATOR}`;

describe('SubGenerator java-audit of entity-audit JHipster blueprint', () => {
  for (const auditFramework of [undefined, 'javers', 'custom']) {
    describe(`run using auditFramework ${auditFramework}`, () => {
      beforeAll(async function () {
        await helpers
          .run(SUB_GENERATOR_NAMESPACE)
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
            },
          ])
          .withOptions({
            creationTimestamp: '2022-01-01',
            ignoreNeedlesError: true,
            auditFramework,
          })
          .withJHipsterLookup()
          .withParentBlueprintLookup();
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

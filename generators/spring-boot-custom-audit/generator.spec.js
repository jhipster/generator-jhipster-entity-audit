import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

const SUB_GENERATOR = 'spring-boot-custom-audit';
const SUB_GENERATOR_NAMESPACE = `jhipster-entity-audit:${SUB_GENERATOR}`;

describe('SubGenerator spring-boot-custom-audit of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .run(SUB_GENERATOR_NAMESPACE)
        .withJHipsterConfig({}, [
          {
            name: 'Audited',
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
          auditFramework: 'custom',
        })
        .withJHipsterLookup()
        .withParentBlueprintLookup();
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });
});

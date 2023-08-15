import { before, describe, expect, it } from 'esmocha';

import { helpers, lookups } from '#test-utils';

const SUB_GENERATOR = 'spring-boot-custom-audit';
const SUB_GENERATOR_NAMESPACE = `jhipster-entity-audit:${SUB_GENERATOR}`;

describe('SubGenerator spring-boot-custom-audit of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    let result;
    before(async function () {
      result = await helpers
        .create(SUB_GENERATOR_NAMESPACE)
        .withOptions({
          reproducible: true,
          defaults: true,
          creationTimestamp: '2022-01-01',
          baseName: 'jhipster',
          ignoreNeedlesError: true,
        })
        .withLookups(lookups)
        .run();
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });
});

import { before, describe, expect, it } from 'esmocha';

import { helpers, lookups } from '#test-utils';

const SUB_GENERATOR = 'angular-audit';
const SUB_GENERATOR_NAMESPACE = `jhipster-entity-audit:${SUB_GENERATOR}`;

describe('SubGenerator angular-audit of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    let result;
    before(async function () {
      result = await helpers
        .create(SUB_GENERATOR_NAMESPACE)
        .withOptions({
          reproducible: true,
          defaults: true,
          baseName: 'jhipster',
          skipMenu: true,
        })
        .withLookups(lookups)
        .run();
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });
});

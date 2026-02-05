import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

const SUB_GENERATOR = 'server';

describe('SubGenerator server of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .runJHipster(SUB_GENERATOR)
        .withJHipsterConfig()
        .withOptions({
          creationTimestamp: '2022-01-01',
          ignoreNeedlesError: true,
          blueprint: ['entity-audit'],
        })
        .withJHipsterGenerators()
        .withConfiguredBlueprint()
        .withMockedGenerators(['jhipster-entity-audit:java-audit']);
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
    it('should compose with jhipster-entity-audit:java-audit', () => {
      result.assertGeneratorComposedOnce('jhipster-entity-audit:java-audit');
    });
    it('should not write audit files', () => {
      expect(result.getStateSnapshot('**/audit/**')).toMatchObject({});
    });
  });
});

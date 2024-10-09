import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

const SUB_GENERATOR = 'server';
const BLUEPRINT_NAMESPACE = `jhipster:${SUB_GENERATOR}`;

describe('SubGenerator server of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .run(BLUEPRINT_NAMESPACE)
        .withJHipsterConfig()
        .withOptions({
          creationTimestamp: '2022-01-01',
          ignoreNeedlesError: true,
          blueprint: ['entity-audit'],
        })
        .withJHipsterLookup()
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

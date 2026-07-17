import { beforeAll, describe, expect, it } from 'vitest';

import { createTestHelpers, typedResult } from 'generator-jhipster/testing';

import type Generator from './generator.js';

const helpers = createTestHelpers<Generator>({
  importMeta: import.meta,
  defaultGenerator: 'jhipster-entity-audit:spring-boot-custom-audit',
});
const result = typedResult<Generator>();

describe('SubGenerator spring-boot-custom-audit of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .runDefault()
        .withJHipsterConfig()
        .withOptions({
          ignoreNeedlesError: true,
        })
        .withJHipsterGenerators()
        .withConfiguredBlueprint()
        .withBlueprintConfig({});
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });
});

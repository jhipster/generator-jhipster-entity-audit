import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

const SUB_GENERATOR = 'languages';
const BLUEPRINT_NAMESPACE = `jhipster:${SUB_GENERATOR}`;

describe('SubGenerator languages of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .run(BLUEPRINT_NAMESPACE)
        .withJHipsterConfig()
        .withOptions({
          ignoreNeedlesError: true,
          blueprint: ['entity-audit'],
        })
        .withJHipsterGenerators()
        .withConfiguredBlueprint();
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });

  describe('microservice with skipClient', () => {
    beforeAll(async function () {
      await helpers
        .run(BLUEPRINT_NAMESPACE)
        .withJHipsterConfig({
          applicationType: 'microservice',
          skipClient: true,
        })
        .withOptions({
          ignoreNeedlesError: true,
          blueprint: ['entity-audit'],
        })
        .withJHipsterGenerators()
        .withConfiguredBlueprint();
    });

    it('should skip writing client language files when skipClient is true', () => {
      result.assertNoFile('src/main/webapp/i18n/en/entity-audit.json');
    });
  });
});

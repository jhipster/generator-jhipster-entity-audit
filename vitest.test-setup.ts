import { fileURLToPath } from 'node:url';

import { defineDefaults } from 'generator-jhipster/testing';

await defineDefaults({
  blueprint: 'generator-jhipster-entity-audit',
  blueprintPackagePath: fileURLToPath(new URL('./', import.meta.url)),
});

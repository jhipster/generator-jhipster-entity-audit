import type { JHipsterCommandDefinition } from 'generator-jhipster';

export default {
  configs: {},
  import: ['jhipster-entity-audit:java-audit' as any],
} as const satisfies JHipsterCommandDefinition;

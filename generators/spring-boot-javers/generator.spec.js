import { beforeAll, describe, expect, it } from 'vitest';

import { defaultHelpers as helpers, result } from 'generator-jhipster/testing';

const SUB_GENERATOR = 'spring-boot-javers';
const SUB_GENERATOR_NAMESPACE = `jhipster-entity-audit:${SUB_GENERATOR}`;

describe('SubGenerator spring-boot-javers of entity-audit JHipster blueprint', () => {
  describe('run', () => {
    beforeAll(async function () {
      await helpers
        .run(SUB_GENERATOR_NAMESPACE)
        .withJHipsterConfig()
        .withOptions({
          ignoreNeedlesError: true,
          auditFramework: 'javers',
        })
        .withJHipsterGenerators()
        .withConfiguredBlueprint();
    });

    it('should succeed', () => {
      expect(result.getStateSnapshot()).toMatchSnapshot();
    });
  });
  describe('should generate AuditedEntity', () => {
    beforeAll(async function () {
      await helpers
        .runJDL(
          `
application {
  config {
    baseName jhipster
    blueprints [generator-jhipster-entity-audit]
  }

  config(generator-jhipster-entity-audit) {
    auditFramework javers
  }

  entities *
}

@EnableAudit
@ChangelogDate("20200101000100")
entity CamelCase {
  name String required
}

@EnableAudit
@EntityPackage("custom")
@ChangelogDate("20200101000200")
entity WithEntityPackage {
  name String required
}
`,
        )
        .withConfiguredBlueprint();
    });

    it('generate .yo-rc.json content', () => {
      result.assertJsonFileContent('.yo-rc.json', {
        'generator-jhipster-entity-audit': {
          auditFramework: 'javers',
          auditPage: true,
        },
      });
    });

    it('generate AuditedEntity content', () => {
      expect(result.getSnapshot('**/AuditedEntity.java')).toMatchSnapshot();
    });
  });

  describe('with TextBlob field on MySQL', () => {
    beforeAll(async function () {
      await helpers
        .runJDL(
          `
application {
  config {
    baseName jhipster
    prodDatabaseType mysql
    blueprints [generator-jhipster-entity-audit]
  }

  config(generator-jhipster-entity-audit) {
    auditFramework javers
  }

  entities *
}

@EnableAudit
@ChangelogDate("20200101000100")
entity Post {
  title String required
  content TextBlob required
}
`,
        )
        .withConfiguredBlueprint();
    });

    it('should annotate TextBlob field with @DiffIgnore when using MySQL', () => {
      result.assertFileContent(
        'src/main/java/com/mycompany/myapp/domain/Post.java',
        'import org.javers.core.metamodel.annotation.DiffIgnore;',
      );
      result.assertFileContent('src/main/java/com/mycompany/myapp/domain/Post.java', /@DiffIgnore\s+private String content;/);
      result.assertNoFileContent('src/main/java/com/mycompany/myapp/domain/Post.java', /@DiffIgnore\s+private String title;/);
    });
  });
});

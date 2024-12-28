import { fromMatrix } from 'generator-jhipster/testing';

export default Object.fromEntries(
  Object.entries(
    fromMatrix({
      buildTool: ['maven', 'gradle'],
      auditFramework: ['custom', 'javers'],
    }),
  ).map(([key, { buildTool, auditFramework, ...value }]) => [
    key,
    {
      ...value,
      'job-name': `${auditFramework}, ${buildTool}, postgresql-mvc-jwt`,
      'sample-type': 'jdl-ejs',
      'sample-file': 'postgresql-mvc-jwt',
      jdlOptions: { auditFramework, buildTool },
      'audit-framework': auditFramework,
      'build-tool': buildTool,
    },
  ]),
);

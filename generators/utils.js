const glob = require('glob');


const TPL = 'template';

const changeset = (changelogDate, entityTableName) =>
  `
    <!-- Added the entity audit columns -->
    <changeSet id="${changelogDate}-audit-1" author="jhipster-entity-audit">
        <addColumn tableName="${entityTableName}">
            <column name="created_by" type="varchar(50)">
                <constraints nullable="false"/>
            </column>
            <column name="created_date" type="timestamp" defaultValueDate="\${now}">
                <constraints nullable="false"/>
            </column>
            <column name="last_modified_by" type="varchar(50)"/>
            <column name="last_modified_date" type="timestamp"/>
        </addColumn>
    </changeSet>`;

const copyFiles = (gen, files) => {
  files.forEach((file) => {
    gen.copyTemplate(file.from, file.to, file.type ? file.type : TPL, gen, file.interpolate ? {
      interpolate: file.interpolate
    } : undefined);
  });
};

const updateEntityAudit = function (entityName, entityData, javaDir, resourceDir, updateIndex) {
  if (this.auditFramework === 'custom') {
    // extend entity with AbstractAuditingEntity
    if (!this.fs.read(`${javaDir}domain/${entityName}.java`, {
      defaults: ''
    }).includes('extends AbstractAuditingEntity')) {
      this.replaceContent(`${javaDir}domain/${entityName}.java`, `public class ${entityName}`, `public class ${entityName} extends AbstractAuditingEntity`);
    }
    // extend DTO with AbstractAuditingDTO
    if (entityData.dto === 'mapstruct') {
      if (!this.fs.read(`${javaDir}service/dto/${entityName}DTO.java`, {
        defaults: ''
      }).includes('extends AbstractAuditingDTO')) {
        this.replaceContent(`${javaDir}service/dto/${entityName}DTO.java`, `public class ${entityName}DTO`, `public class ${entityName}DTO extends AbstractAuditingDTO`);
      }
    }

    // update liquibase changeset
    const file = glob.sync(`${resourceDir}/config/liquibase/changelog/*_added_entity_${entityName}.xml`)[0];
    const entityTableName = entityData.entityTableName ? entityData.entityTableName : entityName;
    this.addChangesetToLiquibaseEntityChangelog(file, changeset(this.changelogDate, this.getTableName(entityTableName)));
  } else if (this.auditFramework === 'javers') {
    // check if repositories are already annotated
    const auditTableAnnotation = '@JaversSpringDataAuditable';
    const pattern = new RegExp(auditTableAnnotation, 'g');
    const content = this.fs.read(`${javaDir}repository/${entityName}Repository.java`, 'utf8');

    if (!pattern.test(content)) {
      // add javers annotations to repository
      if (!this.fs.read(`${javaDir}repository/${entityName}Repository.java`, {
        defaults: ''
      }).includes('@JaversSpringDataAuditable')) {
        this.replaceContent(`${javaDir}repository/${entityName}Repository.java`, `public interface ${entityName}Repository`, `@JaversSpringDataAuditable\npublic interface ${entityName}Repository`);
        this.replaceContent(`${javaDir}repository/${entityName}Repository.java`, `domain.${entityName};`, `domain.${entityName};\nimport org.javers.spring.annotation.JaversSpringDataAuditable;`);
      }

      // this is used from :entity subgenerator to update the list of
      // audited entities (if audit page available) in `#getAuditedEntities`
      // method in `JaversEntityAuditResource` class, in case that list
      // has changed after running the generator
      if (updateIndex && this.fs.exists(`${javaDir}web/rest/JaversEntityAuditResource.java`)) {
        const files = [{
          from: `${this.javaTemplateDir}/web/rest/_JaversEntityAuditResource.java`,
          to: `${javaDir}web/rest/JaversEntityAuditResource.java`
        }];
        copyFiles(this, files);
      }
    }
  }
};

module.exports = {
  changeset,
  copyFiles,
  updateEntityAudit
};

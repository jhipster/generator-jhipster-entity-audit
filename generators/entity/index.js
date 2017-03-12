'use strict';
var yeoman = require('yeoman-generator'),
  chalk = require('chalk'),
  packagejs = require(__dirname + '/../../package.json'),
  fs = require('fs'),
  glob = require('glob');

// Stores JHipster variables
var jhipsterVar = {moduleName: 'entity-audit'};

// Stores JHipster functions
var jhipsterFunc = {};

module.exports = yeoman.Base.extend({

  initializing: {

    compose: function (args) {
      this.log(this.options);
      this.entityConfig = this.options.entityConfig;
      this.composeWith('jhipster:modules', {
        options: {
          jhipsterVar: jhipsterVar,
          jhipsterFunc: jhipsterFunc
        }
      });
    },

    checkDBType: function () {
      if (jhipsterVar.databaseType !== 'sql' && jhipsterVar.databaseType !== 'mongodb') {
        // exit if DB type is not SQL or MongoDB
        this.abort = true;
      }
    },

    displayLogo: function () {
      if (this.abort){
        return;
      }
      this.log(chalk.white('Running ' + chalk.bold('JHipster Entity Audit') + ' Generator! ' + chalk.yellow('v' + packagejs.version + '\n')));
    },

    validate: function () {
      // this shouldnt be run directly
      if (!this.entityConfig) {
        this.env.error(chalk.red.bold('ERROR!') + ' This sub generator should be used only from JHipster and cannot be run directly...\n');
      }
    },

    getEntitityNames: function () {
      var existingEntities = [],
        existingEntityNames = [];
      try {
        existingEntityNames = fs.readdirSync('.jhipster');
      } catch(e) {
        this.log(chalk.red.bold('ERROR!') + ' Could not read entities, you might not have generated any entities yet. I will continue to install audit files, entities will not be updated...\n');
      }

      existingEntityNames.forEach(function(entry) {
        if(entry.indexOf('.json') !== -1){
          var entityName = entry.replace('.json','');
          existingEntities.push(entityName);
        }
      });
      this.existingEntities = existingEntities;
    }
  },

  prompting: function () {
    if (this.abort){
      return;
    }

    // don't prompt if data are imported from a file
    if (this.entityConfig.useConfigurationFile === true &&  this.entityConfig.data && typeof this.entityConfig.data.enableEntityAudit !== 'undefined') {
      this.enableAudit = this.entityConfig.data.enableEntityAudit;

      if (typeof this.config.get('auditFramework') !== 'undefined') {
        this.auditFramework = this.config.get('auditFramework');
      } else {
        this.auditFramework = 'custom';
      }
      return;
    }

    var done = this.async();
    var entityName = this.entityConfig.entityClass;
    var prompts = [
      {
        type: 'confirm',
        name: 'enableAudit',
        message: `Do you want to enable audit for this entity(${entityName})?`,
        default: true
      }
    ];

    this.prompt(prompts, function (props) {
      this.props = props;
      // To access props later use this.props.someOption;
      this.enableAudit = props.enableAudit;
      this.auditFramework = this.config.get('auditFramework');
      done();
    }.bind(this));
  },
  writing : {
    updateFiles: function () {
      if (this.abort){
        return;
      }
      if (!this.enableAudit){
        return;
      }

      this.baseName = jhipsterVar.baseName;
      this.packageName = jhipsterVar.packageName;
      this.angularAppName = jhipsterVar.angularAppName;
      this.frontendBuilder = jhipsterVar.frontendBuilder;
      this.changelogDate = jhipsterFunc.dateFormatForLiquibase();

      var javaDir = jhipsterVar.javaDir;

      if (this.entityConfig.entityClass) {
        this.log('\n' + chalk.bold.green('I\'m updating the entity for audit ') + chalk.bold.yellow(this.entityConfig.entityClass));

        var entityName = this.entityConfig.entityClass;

        if (this.auditFramework === 'custom') {
          // extend entity with AbstractAuditingEntity
          if(!this.fs.read(javaDir + 'domain/' + entityName + '.java', {defaults: ''}).includes('extends AbstractAuditingEntity')) {
            jhipsterFunc.replaceContent(javaDir + 'domain/' + entityName + '.java', 'public class ' + entityName, 'public class ' + entityName + ' extends AbstractAuditingEntity');
          }
          // extend DTO with AbstractAuditingDTO
          if(this.entityConfig.data.dto === 'mapstruct') {
            if(!this.fs.read(javaDir + 'service/dto/' + entityName + 'DTO.java', {defaults: ''}).includes('extends AbstractAuditingDTO')) {
              jhipsterFunc.replaceContent(javaDir + 'service/dto/' + entityName + 'DTO.java', 'public class ' + entityName + 'DTO', 'public class ' + entityName + 'DTO extends AbstractAuditingDTO');
            }
          }

          //update liquibase changeset
          var file = glob.sync('src/main/resources/config/liquibase/changelog/*_added_entity_' + entityName + '.xml')[0];
          var columns = '<column name=\'created_by\' type=\'varchar(50)\'>\n' +
          '                <constraints nullable=\'false\'/>\n' +
          '            </column>\n' +
          '            <column name=\'created_date\' type=\'timestamp\' defaultValueDate=\'${now}\'>\n' +
          '                <constraints nullable=\'false\'/>\n' +
          '            </column>\n' +
          '            <column name=\'last_modified_by\' type=\'varchar(50)\'/>\n' +
          '            <column name=\'last_modified_date\' type=\'timestamp\'/>';
          jhipsterFunc.addColumnToLiquibaseEntityChangeset(file, columns);

        } else if (this.auditFramework === 'javers') {
          // add javers annotations to repository
          if(!this.fs.read(this.javaDir + 'repository/' + entityName + 'Repository.java', {defaults: ''}).includes('@JaversSpringDataAuditable')) {
            jhipsterFunc.replaceContent(this.javaDir + 'repository/' + entityName + 'Repository.java', 'public interface ' + entityName + 'Repository', '@JaversSpringDataAuditable\npublic interface ' + entityName + 'Repository');
            jhipsterFunc.replaceContent(this.javaDir + 'repository/' + entityName + 'Repository.java', 'domain.' + entityName + ';', 'domain.' + entityName + ';\nimport org.javers.spring.annotation.JaversSpringDataAuditable;');
          }
          //update the list of audited entities if audit page is available
          if (this.fs.exists(this.javaDir + 'web/rest/JaversEntityAuditResource.java')) {
            this.existingEntities.push(entityName);
            this.auditedEntities = [];

            this.existingEntities.forEach(function(entityName) {
              this.auditedEntities.push('\'' + entityName + '\'');
            }, this);

            var files = [
              { from: this.javaTemplateDir + '/web/rest/_JaversEntityAuditResource.java', to: this.javaDir + 'web/rest/JaversEntityAuditResource.java'}
            ];
            this.copyFiles(files);
          }
        }
      }
    },
    updateConfig : function() {
      if (this.abort){
        return;
      }
      jhipsterFunc.updateEntityConfig(this.entityConfig.filename, 'enableEntityAudit', this.enableAudit);
    }
  },

  end: function () {
    if (this.abort){
      return;
    }
    if (this.enableAudit){
      this.log('\n' + chalk.bold.green('Entity audit enabled'));
    }
  }
});

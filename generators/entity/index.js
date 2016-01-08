'use strict';
var path = require('path'),
util = require('util'),
yeoman = require('yeoman-generator'),
chalk = require('chalk'),
jhipster = require('generator-jhipster'),
packagejs = require(__dirname + '/../../package.json'),
fs = require('fs'),
glob = require("glob");

// Stores JHipster variables
var jhipsterVar = {moduleName: 'entity-audit'};

// Stores JHipster functions
var jhipsterFunc = {};

var STRIP_HTML = 'stripHtml',
STRIP_JS = 'stripJs',
COPY = 'copy',
TPL = 'template'

module.exports = yeoman.generators.Base.extend({

  initializing: {

    compose: function (args) {
      this.entityConfig = this.options.entityConfig;
      this.composeWith('jhipster:modules', {
        options: {
          jhipsterVar: jhipsterVar,
          jhipsterFunc: jhipsterFunc
        }
      });
    },

    checkDBType: function () {
      if (jhipsterVar.databaseType != 'sql') {
        // exit if DB type is not SQL
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
    }
  },

  prompting: function () {
    if (this.abort){
      return;
    }
    // don't prompt if data are imported from a file
    if (this.entityConfig.useConfigurationFile == true &&  this.entityConfig.data && typeof this.entityConfig.data.enableEntityAudit !== 'undefined') {
      this.enableAudit = this.entityConfig.data.enableEntityAudit;
      return;
    }
    var done = this.async();
    var prompts = [
      {
        type: 'confirm',
        name: 'enableAudit',
        message: 'Do you want to enable audit for this entity?',
        default: true
      }
    ];

    this.prompt(prompts, function (props) {
      this.props = props;
      // To access props later use this.props.someOption;
      this.enableAudit = props.enableAudit;
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

      var webappDir = jhipsterVar.webappDir,
      javaTemplateDir = 'src/main/java/package',
      javaDir = jhipsterVar.javaDir,
      resourceDir = jhipsterVar.resourceDir,
      interpolateRegex = /<%=([\s\S]+?)%>/g; // so that thymeleaf tags in templates do not get mistreated as _ templates

      if (this.entityConfig.entityClass) {
        this.log('\n' + chalk.bold.green('I\'m updating the entity for audit ') + chalk.bold.yellow(this.entityConfig.entityClass));

        var entityName = this.entityConfig.entityClass;
        // extend entity with AbstractAuditingEntity
        jhipsterFunc.replaceContent(javaDir + 'domain/' + entityName + '.java', 'public class ' + entityName, 'public class ' + entityName + ' extends AbstractAuditingEntity');
        // extend DTO with AbstractAuditingDTO
        if(this.entityConfig.data.dto == 'mapstruct') {
          jhipsterFunc.replaceContent(javaDir + 'web/rest/dto/' + entityName + 'DTO.java', 'public class ' + entityName + 'DTO', 'public class ' + entityName + 'DTO extends AbstractAuditingDTO');
        }

        //update liquibase changeset
        var file = glob.sync("src/main/resources/config/liquibase/changelog/*" + entityName + ".xml")[0];
        var columns = "<column name=\"created_by\" type=\"varchar(50)\">\n" +
        "                <constraints nullable=\"false\"/>\n" +
        "            </column>\n" +
        "            <column name=\"created_date\" type=\"timestamp\" defaultValueDate=\"${now}\">\n" +
        "                <constraints nullable=\"false\"/>\n" +
        "            </column>\n" +
        "            <column name=\"last_modified_by\" type=\"varchar(50)\"/>\n" +
        "            <column name=\"last_modified_date\" type=\"timestamp\"/>";
        jhipsterFunc.addColumnToLiquibaseEntityChangeset(file, columns);

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

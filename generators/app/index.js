'use strict';
var path = require('path'),
    util = require('util'),
    yeoman = require('yeoman-generator'),
    chalk = require('chalk'),
    jhipster = require('generator-jhipster'),
    packagejs = require(__dirname + '/../../package.json'),
    fs = require('fs');

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
      this.composeWith('jhipster:modules', {
        options: {
          jhipsterVar: jhipsterVar,
          jhipsterFunc: jhipsterFunc
        }
      });
      if (args == 'default') {
        this.defaultAudit = true;
      }
    },

    displayLogo: function () {
      console.log(chalk.white('Welcome to the ' + chalk.bold('JHipster Entity Audit') + ' Generator! ' + chalk.yellow('v' + packagejs.version + '\n')));
    },

    checkDBType: function () {
      if (jhipsterVar.databaseType != 'sql') {
        console.log(chalk.red.bold('ERROR!') + ' Only SQL database is supported...\n');
        process.exit(1);
      }
    },

    getEntitityNames: function () {
      var existingEntities = [],
      existingEntityChoices = [],
      existingEntityNames = fs.readdirSync('.jhipster');
      existingEntityNames.forEach(function(entry) {
        var entityName = entry.replace('.json','');
        existingEntities.push(entityName);
        existingEntityChoices.push({name: entityName, value: entityName});
      });
      this.existingEntities = existingEntities;
      this.existingEntityChoices = existingEntityChoices;
    }
  },

  prompting: function () {
    var done = this.async();
    var prompts = [
      {
        type: 'list',
        name: 'updateType',
        message: 'Do you want to enable audit for all existing entities?',
        choices: [
          {name: 'Yes, update all', value: 'all'},
          {name: 'No, let me choose the entities to update', value: 'selected'}
        ],
        default: 'all'
      },{
        when: function (response) {
          return response.updateType != 'all';
        },
        type: 'checkbox',
        name: 'entitiesToUpdate',
        message: 'Please choose the entities to be audited',
        choices: this.existingEntityChoices,
        default: 'none'
      },{
        type: 'confirm',
        name: 'auditPage',
        message: 'Do you want to add an audit log page for entities?',
        default: true
      }
    ];

    if (this.defaultAudit) {
      this.updateType = 'all';
      this.auditPage = true;
      done();
    } else {
      this.prompt(prompts, function (props) {
        this.props = props;
        // To access props later use this.props.someOption;
        this.updateType = props.updateType;
        this.auditPage = props.auditPage;
        this.entitiesToUpdate = props.entitiesToUpdate;
        done();
      }.bind(this));
    }
  },

  writing: function () {
    var done = this.async();

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

    // copy the java file templates
    jhipsterFunc.copyTemplate(javaTemplateDir + '/config/audit/_AsyncEntityAuditEventWriter.java', javaDir + 'config/audit/AsyncEntityAuditEventWriter.java', TPL, this);
    jhipsterFunc.copyTemplate(javaTemplateDir + '/config/audit/_EntityAuditEventListener.java', javaDir + 'config/audit/EntityAuditEventListener.java', TPL, this);
    jhipsterFunc.copyTemplate(javaTemplateDir + '/config/audit/_EntityAuditAction.java', javaDir + 'config/audit/EntityAuditAction.java', TPL, this);
    jhipsterFunc.copyTemplate(javaTemplateDir + '/config/util/_AutowireHelper.java', javaDir + 'config/util/AutowireHelper.java', TPL, this);
    jhipsterFunc.copyTemplate(javaTemplateDir + '/domain/_EntityAuditEvent.java', javaDir + 'domain/EntityAuditEvent.java', TPL, this);
    jhipsterFunc.copyTemplate(javaTemplateDir + '/repository/_EntityAuditEventRepository.java', javaDir + 'repository/EntityAuditEventRepository.java', TPL, this);
    jhipsterFunc.copyTemplate(resourceDir + '/config/liquibase/changelog/_EntityAuditEvent.xml',
            resourceDir + 'config/liquibase/changelog/' + this.changelogDate + '_added_entity_EntityAuditEvent.xml', TPL, this, { 'interpolate': interpolateRegex });

    jhipsterFunc.addChangelogToLiquibase(this.changelogDate + '_added_entity_EntityAuditEvent.xml');
    // replace the Listener on the 'AbstractAuditingEntity' class
    jhipsterFunc.replaceContent(javaDir + 'domain/AbstractAuditingEntity.java', 'AuditingEntityListener.class', 'EntityAuditEventListener.class');
    jhipsterFunc.replaceContent(javaDir + 'domain/AbstractAuditingEntity.java',
      'import org.springframework.data.jpa.domain.support.AuditingEntityListener',
      'import ' + this.packageName + '.config.audit.EntityAuditEventListener');

    // Update existing entities to enable audit
    if (this.updateType == 'all') {
      this.entitiesToUpdate = this.existingEntities;
    }
    if (this.entitiesToUpdate && this.entitiesToUpdate.length > 0 && this.entitiesToUpdate != 'none') {
      console.log('\n' + chalk.bold.green('Updating selected entities ') + chalk.bold.yellow(this.entitiesToUpdate));
      console.log('\n' + chalk.bold.yellow('Make sure these classes does not extend any other class to avoid any errors during compilation.'));
      this.entitiesToUpdate.forEach(function(entityName) {
        jhipsterFunc.replaceContent(javaDir + 'domain/' + entityName + '.java', 'public class ' + entityName, 'public class ' + entityName + ' extends AbstractAuditingEntity');
      }, this);
    }

    // Create audit log page for entities
    if (this.auditPage) {
      jhipsterFunc.copyTemplate(javaTemplateDir + '/web/rest/_EntityAuditResource.java', javaDir + 'web/rest/EntityAuditResource.java', TPL, this);
      jhipsterFunc.copyTemplate(webappDir + '/scripts/app/admin/entityAudit/_entityAudits.html', webappDir + 'scripts/app/admin/entityAudit/entityAudits.html', STRIP_HTML, this);
      jhipsterFunc.copyTemplate(webappDir + '/scripts/app/admin/entityAudit/_entityAudit.detail.html', webappDir + 'scripts/app/admin/entityAudit/entityAudit.detail.html', STRIP_HTML, this);
      jhipsterFunc.copyTemplate(webappDir + '/scripts/app/admin/entityAudit/_entityAudit.js', webappDir + 'scripts/app/admin/entityAudit/entityAudit.js', STRIP_JS, this);
      jhipsterFunc.copyTemplate(webappDir + '/scripts/app/admin/entityAudit/_entityAudit.controller.js', webappDir + 'scripts/app/admin/entityAudit/entityAudit.controller.js', TPL, this);
      jhipsterFunc.copyTemplate(webappDir + '/scripts/app/admin/entityAudit/_entityAudit.detail.controller.js', webappDir + 'scripts/app/admin/entityAudit/entityAudit.detail.controller.js', TPL, this);
      jhipsterFunc.copyTemplate(webappDir + '/scripts/components/admin/_entityAudit.service.js', webappDir + 'scripts/components/admin/entityAudit.service.js', TPL, this);
      // add the scripts to index.html
      jhipsterFunc.addJavaScriptToIndex('components/admin/entityAudit.service.js');
      jhipsterFunc.addJavaScriptToIndex('app/admin/entityAudit/entityAudit.js');
      jhipsterFunc.addJavaScriptToIndex('app/admin/entityAudit/entityAudit.controller.js');
      // add bower dependency required
      jhipsterFunc.addBowerDependency('angular-object-diff', '0.1.0');
      jhipsterFunc.addAngularJsModule('ds.objectDiff');
      // add new menu entry
      jhipsterFunc.addElementToAdminMenu('entityAudit', 'bell', jhipsterVar.enableTranslation);
      jhipsterFunc.addTranslationKeyToAllLanguages('entityAudit', 'Entity Audit', 'addAdminElementTranslationKey', jhipsterVar.enableTranslation);
    }

    done();
  },

  install: function () {
    var injectDependenciesAndConstants = function () {
      switch (this.frontendBuilder) {
        case 'gulp':
          this.spawnCommand('gulp', ['ngconstant:dev', 'wiredep:test', 'wiredep:app']);
          break;
        case 'grunt':
        default:
          this.spawnCommand('grunt', ['ngconstant:dev', 'wiredep']);
      }
    };

    this.installDependencies({
      callback: injectDependenciesAndConstants.bind(this)
    });
  },

  end: function () {
    //console.log('\n' + chalk.bold.green('Auditing enabled for entities, you will have an option to enable audit while creating new entities as well'));
    console.log('\n' + chalk.bold.green('Running wiredep now'));
  }
});

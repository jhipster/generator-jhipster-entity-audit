'use strict';
var yeoman = require('yeoman-generator'),
  chalk = require('chalk'),
  packagejs = require(__dirname + '/../../package.json'),
  fs = require('fs'),
  semver = require('semver'),
  glob = require('glob');

// Stores JHipster variables
var jhipsterVar = {moduleName: 'entity-audit'};

// Stores JHipster functions
var jhipsterFunc = {};

const TPL = 'template';

module.exports = yeoman.Base.extend({

  initializing: {
    compose: function (args) {
      this.composeWith('jhipster:modules', {
        options: {
          jhipsterVar: jhipsterVar,
          jhipsterFunc: jhipsterFunc
        }
      });

      if (args === 'default') {
        this.defaultAudit = true;
      }
      if (args === 'javers') {
        this.javersAudit = true;
      }
    },

    displayLogo: function () {
      this.log(chalk.white('Welcome to the ' + chalk.bold('JHipster Entity Audit') + ' Generator! ' + chalk.yellow('v' + packagejs.version + '\n')));
    },

    checkJHVersion: function () {
      var supportedJHVersion = packagejs.dependencies['generator-jhipster'];
      if (jhipsterVar.jhipsterVersion && !semver.satisfies(jhipsterVar.jhipsterVersion, supportedJHVersion)) {
        this.env.error(`${chalk.red.bold('ERROR!')}  I support only JHipster versions greater than ${supportedJHVersion}...
          If you want to use Entity Audit with an older JHipster version, download a previous version that supports the required JHipster version.`);
      }
    },

    checkDBType: function () {
      if (jhipsterVar.databaseType !== 'sql' && jhipsterVar.databaseType !== 'mongodb') {
        this.env.error(chalk.red.bold('ERROR!') + ' I support only SQL or MongoDB databases...\n');
      }
    },

    getEntitityNames: function () {
      var existingEntities = [],
        existingEntityChoices = [],
        existingEntityNames = [];
      try{
        existingEntityNames = fs.readdirSync('.jhipster');
      } catch(e) {
        this.log(chalk.red.bold('ERROR!') + ' Could not read entities, you might not have generated any entities yet. I will continue to install audit files, entities will not be updated...\n');
      }

      existingEntityNames.forEach(function(entry) {
        if(entry.indexOf('.json') !== -1){
          var entityName = entry.replace('.json','');
          existingEntities.push(entityName);
          existingEntityChoices.push({name: entityName, value: entityName});
        }
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
        name: 'auditFramework',
        message: 'Choose which audit framework you would like to use.',
        choices: [
          {name: 'Custom JHipster auditing (works with SQL)', value: 'custom'},
          {name: '[BETA] Javers auditing framework (works with SQL and MongoDB)', value: 'javers'}
        ],
        default: 'custom'
      },
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
          return response.updateType !== 'all';
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
      this.auditFramework = 'custom';
      this.updateType = 'all';
      this.auditPage = true;
      done();
    } else if(this.javersAudit) {
      this.auditFramework = 'javers';
      this.updateType = 'all';
      this.auditPage = true;
      done();
    } else {
      this.prompt(prompts, function (props) {

        // Check if an invalid database, auditFramework is selected
        if (props.auditFramework === 'custom' && jhipsterVar.databaseType === 'mongodb') {
          this.env.error(chalk.red.bold('ERROR!') + ' The JHipster audit framework supports SQL databases only...\n');
        } else if (props.auditFramework === 'javers' && jhipsterVar.databaseType !== 'sql' && jhipsterVar.databaseType !== 'mongodb'){
          this.env.error(chalk.red.bold('ERROR!') + ' The Javers audit framework supports only SQL or MongoDB databases...\n');
        }

        this.props = props;
        // To access props later use this.props.someOption;
        this.auditFramework = props.auditFramework;
        this.updateType = props.updateType;
        this.auditPage = props.auditPage;
        this.entitiesToUpdate = props.entitiesToUpdate;
        done();
      }.bind(this));
    }
  },

  writing: {
    updateYeomanConfig : function() {
      this.config.set('auditFramework', this.auditFramework);
    },

    setupGlobalVar : function () {
      this.baseName = jhipsterVar.baseName;
      this.packageName = jhipsterVar.packageName;
      this.angularAppName = jhipsterVar.angularAppName;
      this.frontendBuilder = jhipsterVar.frontendBuilder;
      this.buildTool = jhipsterVar.buildTool;
      this.databaseType = jhipsterVar.databaseType;
      this.devDatabaseType = jhipsterVar.devDatabaseType;
      this.prodDatabaseType = jhipsterVar.prodDatabaseType;
      this.enableTranslation = jhipsterVar.enableTranslation;
      this.languages = jhipsterVar.languages;
      this.changelogDate = jhipsterFunc.dateFormatForLiquibase();
      // if changelogDate for entity audit already exists then use this existing changelogDate
      var liguibaseFileName = glob.sync(jhipsterVar.resourceDir + '/config/liquibase/changelog/*_added_entity_EntityAuditEvent.xml')[0];
      if (liguibaseFileName) {
        this.changelogDate = new RegExp('/config/liquibase/changelog/(.*)_added_entity_EntityAuditEvent.xml').exec(liguibaseFileName)[1];
      }
      this.webappDir = jhipsterVar.webappDir;
      this.javaTemplateDir = 'src/main/java/package';
      this.javaDir = jhipsterVar.javaDir;
      this.resourceDir = jhipsterVar.resourceDir;
      this.interpolateRegex = /<%=([\s\S]+?)%>/g; // so that thymeleaf tags in templates do not get mistreated as _ templates
      this.copyFiles = function (files) {
        files.forEach( function(file) {
          jhipsterFunc.copyTemplate(file.from, file.to, file.type? file.type: TPL, this, file.interpolate? { 'interpolate': file.interpolate } : undefined);
        }, this);
      };
      this.clientFramework = jhipsterVar.clientFramework;
    },

    writeBaseFiles : function () {
      var files;
      if (this.auditFramework === 'custom') {
        // collect files to copy
        files = [
          { from: this.javaTemplateDir + '/config/audit/_AsyncEntityAuditEventWriter.java', to: this.javaDir + 'config/audit/AsyncEntityAuditEventWriter.java'},
          { from: this.javaTemplateDir + '/config/audit/_EntityAuditEventListener.java', to: this.javaDir + 'config/audit/EntityAuditEventListener.java'},
          { from: this.javaTemplateDir + '/config/audit/_EntityAuditAction.java', to: this.javaDir + 'config/audit/EntityAuditAction.java'},
          { from: this.javaTemplateDir + '/config/audit/_EntityAuditEventConfig.java', to: this.javaDir + 'config/audit/EntityAuditEventConfig.java'},
          { from: this.javaTemplateDir + '/domain/_EntityAuditEvent.java', to: this.javaDir + 'domain/EntityAuditEvent.java'},
          { from: this.javaTemplateDir + '/repository/_EntityAuditEventRepository.java', to: this.javaDir + 'repository/EntityAuditEventRepository.java'},
          { from: this.javaTemplateDir + '/service/dto/_AbstractAuditingDTO.java', to: this.javaDir + 'service/dto/AbstractAuditingDTO.java'},
          { from: this.resourceDir + '/config/liquibase/changelog/_EntityAuditEvent.xml',
            to: this.resourceDir + 'config/liquibase/changelog/' + this.changelogDate + '_added_entity_EntityAuditEvent.xml', interpolate: this.interpolateRegex }
        ];
        this.copyFiles(files);
        jhipsterFunc.addChangelogToLiquibase(this.changelogDate + '_added_entity_EntityAuditEvent');

        // add the new Listener to the 'AbstractAuditingEntity' class and add import
        if(!this.fs.read(this.javaDir + 'domain/AbstractAuditingEntity.java', {defaults: ''}).includes('EntityAuditEventListener.class')) {
          jhipsterFunc.replaceContent(this.javaDir + 'domain/AbstractAuditingEntity.java', 'AuditingEntityListener.class', '{AuditingEntityListener.class, EntityAuditEventListener.class}');
          jhipsterFunc.rewriteFile(this.javaDir + 'domain/AbstractAuditingEntity.java',
            'import org.springframework.data.jpa.domain.support.AuditingEntityListener',
            'import ' + this.packageName + '.config.audit.EntityAuditEventListener;');
        }
        // remove the jsonIgnore on the audit fields so that the values can be passed
        jhipsterFunc.replaceContent(this.javaDir + 'domain/AbstractAuditingEntity.java', '\s*@JsonIgnore', '', true);

      } else {

        files = [
          { from: this.javaTemplateDir + '/config/audit/_JaversAuthorProvider.java', to: this.javaDir + 'config/audit/JaversAuthorProvider.java'},
          { from: this.javaTemplateDir + '/config/audit/_EntityAuditAction.java', to: this.javaDir + 'config/audit/EntityAuditAction.java'},
          { from: this.javaTemplateDir + '/domain/_EntityAuditEvent.java', to: this.javaDir + 'domain/EntityAuditEvent.java'}
        ];

        this.copyFiles(files);
        //add required third party dependencies
        if (this.buildTool === 'maven') {

          if (this.databaseType === 'mongodb') {
            jhipsterFunc.addMavenDependency('org.javers', 'javers-spring-boot-starter-mongo', '2.3.0', '<scope>compile</scope>');
            jhipsterFunc.addMavenDependency('org.mongodb', 'mongo-java-driver', '3.2.2', '<scope>compile</scope>');
          } else if (this.databaseType === 'sql') {
            jhipsterFunc.addMavenDependency('org.javers', 'javers-spring-boot-starter-sql', '2.3.0', '<scope>compile</scope>');
          }

        } else if (this.buildTool === 'gradle') {

          if (this.databaseType === 'mongodb') {
            jhipsterFunc.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-mongo', '2.3.0');
            jhipsterFunc.addGradleDependency('compile', 'org.mongodb', 'mongo-java-driver', '3.2.2');
          } else if (this.databaseType === 'sql') {
            jhipsterFunc.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-sql', '2.3.0');
          }

        }
      }
    },

    updateEntityFiles : function () {
      // Update existing entities to enable audit
      if (this.updateType === 'all') {
        this.entitiesToUpdate = this.existingEntities;
      }
      if (this.entitiesToUpdate && this.entitiesToUpdate.length > 0 && this.entitiesToUpdate !== 'none') {
        this.log('\n' + chalk.bold.green('I\'m Updating selected entities ') + chalk.bold.yellow(this.entitiesToUpdate));
        this.log('\n' + chalk.bold.yellow('Make sure these classes does not extend any other class to avoid any errors during compilation.'));
        var jsonObj = null;
        this.auditedEntities = [];

        this.entitiesToUpdate.forEach(function(entityName) {
          this.auditedEntities.push('\'' + entityName + '\'');
          if (this.auditFramework === 'custom') {
            // extend entity with AbstractAuditingEntity
            if(!this.fs.read(this.javaDir + 'domain/' + entityName + '.java', {defaults: ''}).includes('extends AbstractAuditingEntity')) {
              jhipsterFunc.replaceContent(this.javaDir + 'domain/' + entityName + '.java', 'public class ' + entityName, 'public class ' + entityName + ' extends AbstractAuditingEntity');
            }

            // extend DTO with AbstractAuditingDTO
            jsonObj = this.fs.readJSON('.jhipster/' + entityName + '.json');
            if(jsonObj.dto === 'mapstruct') {
              if(!this.fs.read(this.javaDir + 'service/dto/' + entityName + 'DTO.java', {defaults: ''}).includes('extends AbstractAuditingDTO')) {
                jhipsterFunc.replaceContent(this.javaDir + 'service/dto/' + entityName + 'DTO.java', 'public class ' + entityName + 'DTO', 'public class ' + entityName + 'DTO extends AbstractAuditingDTO');
              }
            }

            //update liquibase changeset
            var file = glob.sync(this.resourceDir + '/config/liquibase/changelog/*_added_entity_' + entityName + '.xml')[0];
            if(file) {
              var columns = '<column name=\'created_by\' type=\'varchar(50)\'>\n' +
              '                <constraints nullable=\'false\'/>\n' +
              '            </column>\n' +
              '            <column name=\'created_date\' type=\'timestamp\' defaultValueDate=\'${now}\'>\n' +
              '                <constraints nullable=\'false\'/>\n' +
              '            </column>\n' +
              '            <column name=\'last_modified_by\' type=\'varchar(50)\'/>\n' +
              '            <column name=\'last_modified_date\' type=\'timestamp\'/>';
              jhipsterFunc.addColumnToLiquibaseEntityChangeset(file, columns);
            }
          } else {

            // check if repositories are already annotated
            var auditTableAnnotation = '@JaversSpringDataAuditable';
            var pattern = new RegExp(auditTableAnnotation, 'g');
            var content = this.fs.read(this.javaDir + 'repository/' + entityName + 'Repository.java', 'utf8');

            if (!pattern.test(content)) {
              // add javers annotations to repository
              if(!this.fs.read(this.javaDir + 'repository/' + entityName + 'Repository.java', {defaults: ''}).includes('@JaversSpringDataAuditable')) {
                jhipsterFunc.replaceContent(this.javaDir + 'repository/' + entityName + 'Repository.java', 'public interface ' + entityName + 'Repository', '@JaversSpringDataAuditable\npublic interface ' + entityName + 'Repository');
                jhipsterFunc.replaceContent(this.javaDir + 'repository/' + entityName + 'Repository.java', 'domain.' + entityName + ';', 'domain.' + entityName + ';\nimport org.javers.spring.annotation.JaversSpringDataAuditable;');
              }
            }
          }
        }, this);
      }
    },

    writeAuditPageFiles : function () {
      // Create audit log page for entities
      if (this.auditPage) {
        var files = [
          { from: this.webappDir + 'app/admin/entity-audit/_entity-audits.html', to: this.webappDir + 'app/admin/entity-audit/entity-audits.html'},
          { from: this.webappDir + 'app/admin/entity-audit/_entity-audit.detail.html', to: this.webappDir + 'app/admin/entity-audit/entity-audit.detail.html'},
          { from: this.webappDir + 'app/admin/entity-audit/_entity-audit.state.js', to: this.webappDir + 'app/admin/entity-audit/entity-audit.state.js'},
          { from: this.webappDir + 'app/admin/entity-audit/_entity-audit.controller.js', to: this.webappDir + 'app/admin/entity-audit/entity-audit.controller.js'},
          { from: this.webappDir + 'app/admin/entity-audit/_entity-audit.detail.controller.js', to: this.webappDir + 'app/admin/entity-audit/entity-audit.detail.controller.js'},
          { from: this.webappDir + 'app/admin/entity-audit/_entity-audit.service.js', to: this.webappDir + 'app/admin/entity-audit/entity-audit.service.js'}
        ];
        if (this.auditFramework === 'custom') {
          files.push(
            { from: this.javaTemplateDir + '/web/rest/_EntityAuditResource.java', to: this.javaDir + 'web/rest/EntityAuditResource.java'}
          );
        } else {
          files.push(
            { from: this.javaTemplateDir + '/web/rest/_JaversEntityAuditResource.java', to: this.javaDir + 'web/rest/JaversEntityAuditResource.java'}
          );
        }
        if (this.enableTranslation) {
          this.languages.forEach(function(language) {
            var sourceLanguage = 'en';
            if (fs.existsSync(this.templatePath() + '/src/main/webapp/i18n/' + language + '/entity-audit.json')) {
              sourceLanguage = language;
            }
            files.push(
              { from: this.webappDir + 'i18n/' + sourceLanguage + '/entity-audit.json', to: this.webappDir + 'i18n/' + language + '/entity-audit.json'}
            );
          }, this);
        }
        this.copyFiles(files);
        // add bower dependency required
        jhipsterFunc.addBowerDependency('angular-object-diff', '1.0.3');
        jhipsterFunc.addAngularJsModule('ds.objectDiff');
        // add new menu entry
        jhipsterFunc.addElementToAdminMenu('entity-audit', 'list-alt', this.enableTranslation, this.clientFramework);
        if (this.enableTranslation) {
          this.languages.forEach(function(language) {
            var menuText = 'Entity Audit';
            try {
              menuText = JSON.parse(fs.readFileSync(this.templatePath() + '/src/main/webapp/i18n/' + language + '/global.json', 'utf8')).global.menu.admin['entity-audit'];
            } catch (e) {
              this.log('Cannot parse file');
            }
            jhipsterFunc.addAdminElementTranslationKey('entity-audit', menuText, language);
          }, this);
        }
      }

    },

    registering: function () {
      try {
        jhipsterFunc.registerModule('generator-jhipster-entity-audit', 'entity', 'post', 'entity', 'Add support for entity audit and audit log page');
      } catch (err) {
        this.log(chalk.red.bold('WARN!') + ' Could not register as a jhipster post entity creation hook...\n');
      }
    }
  },

  install: function () {
    var injectDependenciesAndConstants = function () {
      this.spawnCommand('gulp', ['install']);
    };

    this.installDependencies({
      bower: true,
      npm: false,
      callback: injectDependenciesAndConstants.bind(this)
    });
  },

  end: function () {
    this.log('\n' + chalk.bold.green('Auditing enabled for entities, you will have an option to enable audit while creating new entities as well'));
    this.log('\n' + chalk.bold.green('I\'m running gulp install now'));
  }


});

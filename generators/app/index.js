const chalk = require('chalk');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const fs = require('fs');
const glob = require('glob');

const genUtils = require('../utils');
const packagejs = require('../../package.json');

module.exports = class extends BaseGenerator {
  get initializing() {
    return {
      init(args) {
        if (args === 'default') {
          this.defaultAudit = true;
        }
        if (args === 'javers') {
          this.javersAudit = true;
        }
      },
      readConfig() {
        this.jhAppConfig = this.getAllJhipsterConfig();
        if (!this.jhAppConfig) {
          this.error('Can\'t read .yo-rc.json');
        }
      },

      displayLogo() {
        this.log(chalk.white(`Welcome to the ${chalk.bold('JHipster Entity Audit')} Generator! ${chalk.yellow(`v${packagejs.version}\n`)}`));
      },

      checkJHVersion() {
        const jhipsterVersion = this.jhAppConfig.jhipsterVersion;
        const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
        if (!semver.satisfies(jhipsterVersion, minimumJhipsterVersion)) {
          this.env.error(`${chalk.red.bold('ERROR!')}  I support only JHipster versions greater than ${minimumJhipsterVersion}...
            If you want to use Entity Audit with an older JHipster version, download a previous version that supports the required JHipster version.`);
        }
      },

      checkDBType() {
        if (this.jhAppConfig.databaseType !== 'sql' && this.jhAppConfig.databaseType !== 'mongodb') {
          this.env.error(`${chalk.red.bold('ERROR!')} I support only SQL or MongoDB databases...\n`);
        }
      },

      getEntitityNames() {
        const existingEntities = [];
        const existingEntityChoices = [];
        let existingEntityNames = [];
        try {
          existingEntityNames = fs.readdirSync('.jhipster');
        } catch (e) {
          this.log(`${chalk.red.bold('ERROR!')} Could not read entities, you might not have generated any entities yet. I will continue to install audit files, entities will not be updated...\n`);
        }

        existingEntityNames.forEach((entry) => {
          if (entry.indexOf('.json') !== -1) {
            const entityName = entry.replace('.json', '');
            existingEntities.push(entityName);
            existingEntityChoices.push({
              name: entityName,
              value: entityName
            });
          }
        });
        this.existingEntities = existingEntities;
        this.existingEntityChoices = existingEntityChoices;
      }
    };
  }

  prompting() {
    const done = this.async();
    const prompts = [{
      type: 'list',
      name: 'auditFramework',
      message: 'Choose which audit framework you would like to use.',
      choices: [{
        name: 'Custom JHipster auditing (works with SQL)',
        value: 'custom'
      },
      {
        name: '[BETA] Javers auditing framework (works with SQL and MongoDB)',
        value: 'javers'
      }
      ],
      default: 'custom'
    },
    {
      type: 'list',
      name: 'updateType',
      message: 'Do you want to enable audit for all existing entities?',
      choices: [{
        name: 'Yes, update all',
        value: 'all'
      },
      {
        name: 'No, let me choose the entities to update',
        value: 'selected'
      }
      ],
      default: 'all'
    }, {
      when: response => response.updateType !== 'all',
      type: 'checkbox',
      name: 'auditedEntities',
      message: 'Please choose the entities to be audited',
      choices: this.existingEntityChoices,
      default: 'none'
    }, {
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
    } else if (this.javersAudit) {
      this.auditFramework = 'javers';
      this.updateType = 'all';
      this.auditPage = true;
      done();
    } else {
      this.prompt(prompts).then((props) => {
        // Check if an invalid database, auditFramework is selected
        if (props.auditFramework === 'custom' && this.jhAppConfig.databaseType === 'mongodb') {
          this.env.error(`${chalk.red.bold('ERROR!')} The JHipster audit framework supports SQL databases only...\n`);
        } else if (props.auditFramework === 'javers' && this.jhAppConfig.databaseType !== 'sql' && this.jhAppConfig.databaseType !== 'mongodb') {
          this.env.error(`${chalk.red.bold('ERROR!')} The Javers audit framework supports only SQL or MongoDB databases...\n`);
        }

        this.props = props;
        // To access props later use this.props.someOption;
        this.auditFramework = props.auditFramework;
        this.updateType = props.updateType;
        this.auditPage = props.auditPage;
        this.auditedEntities = props.auditedEntities;
        done();
      });
    }
  }
  get writing() {
    return {
      updateYeomanConfig() {
        this.config.set('auditFramework', this.auditFramework);
      },

      setupGlobalVar() {
        // read config from .yo-rc.json
        this.baseName = this.jhAppConfig.baseName;
        this.packageName = this.jhAppConfig.packageName;
        this.buildTool = this.jhAppConfig.buildTool;
        this.databaseType = this.jhAppConfig.databaseType;
        this.devDatabaseType = this.jhAppConfig.devDatabaseType;
        this.prodDatabaseType = this.jhAppConfig.prodDatabaseType;
        this.enableTranslation = this.jhAppConfig.enableTranslation;
        this.languages = this.jhAppConfig.languages;
        this.clientFramework = this.jhAppConfig.clientFramework;
        this.hibernateCache = this.jhAppConfig.hibernateCache;
        this.packageFolder = this.jhAppConfig.packageFolder;
        this.clientPackageManager = this.jhAppConfig.clientPackageManager;
        this.buildTool = this.jhAppConfig.buildTool;
        this.cacheProvider = this.jhAppConfig.cacheProvider;
        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();
        this.angularXAppName = this.getAngularXAppName();
        this.changelogDate = this.dateFormatForLiquibase();
        this.jhiPrefix = this.jhAppConfig.jhiPrefix;
        // if changelogDate for entity audit already exists then use this existing changelogDate
        const liguibaseFileName = glob.sync(`${this.jhAppConfig.resourceDir}/config/liquibase/changelog/*_added_entity_EntityAuditEvent.xml`)[0];
        if (liguibaseFileName) {
          this.changelogDate = new RegExp('/config/liquibase/changelog/(.*)_added_entity_EntityAuditEvent.xml').exec(liguibaseFileName)[1];
        }


        // use constants from generator-constants.js
        this.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
        this.javaTemplateDir = 'src/main/java/package';
        this.javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        this.resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        this.interpolateRegex = jhipsterConstants.INTERPOLATE_REGEX;
      },

      writeBaseFiles() {
        let files;
        if (this.auditFramework === 'custom') {
          // collect files to copy
          files = [{
            from: `${this.javaTemplateDir}/config/audit/_AsyncEntityAuditEventWriter.java`,
            to: `${this.javaDir}config/audit/AsyncEntityAuditEventWriter.java`
          },
          {
            from: `${this.javaTemplateDir}/config/audit/_EntityAuditEventListener.java`,
            to: `${this.javaDir}config/audit/EntityAuditEventListener.java`
          },
          {
            from: `${this.javaTemplateDir}/config/audit/_EntityAuditAction.java`,
            to: `${this.javaDir}config/audit/EntityAuditAction.java`
          },
          {
            from: `${this.javaTemplateDir}/config/audit/_EntityAuditEventConfig.java`,
            to: `${this.javaDir}config/audit/EntityAuditEventConfig.java`
          },
          {
            from: `${this.javaTemplateDir}/domain/_EntityAuditEvent.java`,
            to: `${this.javaDir}domain/EntityAuditEvent.java`
          },
          {
            from: `${this.javaTemplateDir}/repository/_EntityAuditEventRepository.java`,
            to: `${this.javaDir}repository/EntityAuditEventRepository.java`
          },
          {
            from: `${this.javaTemplateDir}/service/dto/_AbstractAuditingDTO.java`,
            to: `${this.javaDir}service/dto/AbstractAuditingDTO.java`
          },
          {
            from: `${this.resourceDir}/config/liquibase/changelog/_EntityAuditEvent.xml`,
            to: `${this.resourceDir}config/liquibase/changelog/${this.changelogDate}_added_entity_EntityAuditEvent.xml`,
            interpolate: this.interpolateRegex
          }
          ];
          genUtils.copyFiles(this, files);
          this.addChangelogToLiquibase(`${this.changelogDate}_added_entity_EntityAuditEvent`);

          // add the new Listener to the 'AbstractAuditingEntity' class and add import
          if (!this.fs.read(`${this.javaDir}domain/AbstractAuditingEntity.java`, {
            defaults: ''
          }).includes('EntityAuditEventListener.class')) {
            this.replaceContent(`${this.javaDir}domain/AbstractAuditingEntity.java`, 'AuditingEntityListener.class', '{AuditingEntityListener.class, EntityAuditEventListener.class}');
            this.rewriteFile(
              `${this.javaDir}domain/AbstractAuditingEntity.java`,
              'import org.springframework.data.jpa.domain.support.AuditingEntityListener',
              `import ${this.packageName}.config.audit.EntityAuditEventListener;`
            );
          }
          // remove the jsonIgnore on the audit fields so that the values can be passed
          // eslint-disable-next-line no-useless-escape
          this.replaceContent(`${this.javaDir}domain/AbstractAuditingEntity.java`, '\s*@JsonIgnore', '', true);
          this.replaceContent(`${this.javaDir}domain/AbstractAuditingEntity.java`, 'import com.fasterxml.jackson.annotation.JsonIgnore;', '', true);

          this.addEntryToCache(`${this.packageName}.domain.EntityAuditEvent.class.getName()`, this.packageFolder, this.cacheProvider);
        } else {
          files = [{
            from: `${this.javaTemplateDir}/config/audit/_JaversAuthorProvider.java`,
            to: `${this.javaDir}config/audit/JaversAuthorProvider.java`
          },
          {
            from: `${this.javaTemplateDir}/config/audit/_EntityAuditAction.java`,
            to: `${this.javaDir}config/audit/EntityAuditAction.java`
          },
          {
            from: `${this.javaTemplateDir}/domain/_EntityAuditEvent.java`,
            to: `${this.javaDir}domain/EntityAuditEvent.java`
          }
          ];

          genUtils.copyFiles(this, files);
          // add required third party dependencies
          if (this.buildTool === 'maven') {
            if (this.databaseType === 'mongodb') {
              this.addMavenDependency('org.javers', 'javers-spring-boot-starter-mongo', '3.5.0', '<scope>compile</scope>');
              this.addMavenDependency('org.mongodb', 'mongo-java-driver', '3.4.2', '<scope>compile</scope>');
            } else if (this.databaseType === 'sql') {
              this.addMavenDependency('org.javers', 'javers-spring-boot-starter-sql', '3.5.0', '<scope>compile</scope>');
            }
          } else if (this.buildTool === 'gradle') {
            if (this.databaseType === 'mongodb') {
              this.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-mongo', '3.5.0');
              this.addGradleDependency('compile', 'org.mongodb', 'mongo-java-driver', '3.4.2');
            } else if (this.databaseType === 'sql') {
              this.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-sql', '3.5.0');
            }
          }
        }
      },

      updateEntityFiles() {
        // Update existing entities to enable audit
        if (this.updateType === 'all') {
          this.auditedEntities = this.existingEntities;
        }
        if (this.auditedEntities && this.auditedEntities.length > 0 && this.auditedEntities !== 'none') {
          this.log(`\n${chalk.bold.green('I\'m Updating selected entities ')}${chalk.bold.yellow(this.auditedEntities)}`);
          this.log(`\n${chalk.bold.yellow('Make sure these classes does not extend any other class to avoid any errors during compilation.')}`);
          let jsonObj = null;

          this.auditedEntities.forEach((entityName) => {
            const entityFile = `.jhipster/${entityName}.json`;
            jsonObj = this.fs.readJSON(entityFile);

            // flag this entity as audited so the :entity subgenerator
            // can pick up all audited entities
            // technically this is only needed for Javers, as the custom
            // framework obtains this list at runtime using
            // `EntityAuditEventRepository.findAllEntityTypes`;
            this.updateEntityConfig(entityFile, 'enableEntityAudit', true);

            genUtils.updateEntityAudit.call(this, entityName, jsonObj, this.javaDir, this.resourceDir);
          });
        }
      },

      writeAuditPageFiles() {
        // Create audit log page for entities
        if (!this.auditPage) return;

        let files = [];
        if (this.clientFramework === 'angular1') {
          files = [{
            from: `${this.webappDir}angularjs/app/admin/entity-audit/_entity-audits.html`,
            to: `${this.webappDir}app/admin/entity-audit/entity-audits.html`
          },
          {
            from: `${this.webappDir}angularjs/app/admin/entity-audit/_entity-audit.detail.html`,
            to: `${this.webappDir}app/admin/entity-audit/entity-audit.detail.html`
          },
          {
            from: `${this.webappDir}angularjs/app/admin/entity-audit/_entity-audit.state.js`,
            to: `${this.webappDir}app/admin/entity-audit/entity-audit.state.js`
          },
          {
            from: `${this.webappDir}angularjs/app/admin/entity-audit/_entity-audit.controller.js`,
            to: `${this.webappDir}app/admin/entity-audit/entity-audit.controller.js`
          },
          {
            from: `${this.webappDir}angularjs/app/admin/entity-audit/_entity-audit.detail.controller.js`,
            to: `${this.webappDir}app/admin/entity-audit/entity-audit.detail.controller.js`
          },
          {
            from: `${this.webappDir}angularjs/app/admin/entity-audit/_entity-audit.service.js`,
            to: `${this.webappDir}app/admin/entity-audit/entity-audit.service.js`
          }
          ];
        } else {
          files = [
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit-event.model.ts`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit-event.model.ts`
            },
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit-modal.component.html`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit-modal.component.html`
            },
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit-modal.component.ts`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit-modal.component.ts`
            },
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit-routing.module.ts`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit-routing.module.ts`
            },
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit.component.html`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit.component.html`
            },
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit.component.ts`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit.component.ts`
            },
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit.module.ts`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit.module.ts`
            },
            {
              from: `${this.webappDir}angular/app/admin/entity-audit/_entity-audit.service.ts`,
              to: `${this.webappDir}app/admin/entity-audit/entity-audit.service.ts`
            },
          ];
        }

        if (this.auditFramework === 'custom') {
          files.push({
            from: `${this.javaTemplateDir}/web/rest/_EntityAuditResource.java`,
            to: `${this.javaDir}web/rest/EntityAuditResource.java`
          });
        } else {
          files.push({
            from: `${this.javaTemplateDir}/web/rest/_JaversEntityAuditResource.java`,
            to: `${this.javaDir}web/rest/JaversEntityAuditResource.java`
          });
        }

        if (this.enableTranslation) {
          this.languages.forEach((language) => {
            let sourceLanguage = 'en';
            if (fs.existsSync(`${this.templatePath()}/src/main/webapp/i18n/${language}/entity-audit.json`)) {
              sourceLanguage = language;
            }
            files.push({
              from: `${this.webappDir}i18n/${sourceLanguage}/entity-audit.json`,
              to: `${this.webappDir}i18n/${language}/entity-audit.json`
            });
          });
        }

        genUtils.copyFiles(this, files);

        // add bower dependency required
        if (this.clientFramework === 'angular1') {
          this.addBowerDependency('angular-object-diff', '1.0.3');
          this.addAngularJsModule('ds.objectDiff');
        } else {
          // add dependency required for displaying diffs
          this.addNpmDependency('ng-diff-match-patch', '2.0.6');
          // based on BaseGenerator.addAdminToModule
          const adminModulePath = `${this.webappDir}app/admin/admin.module.ts`;
          this.rewriteFile(
            adminModulePath,
            'jhipster-needle-add-admin-module-import',
            'import { EntityAuditModule } from \'./entity-audit/entity-audit.module\';'
          );
          this.rewriteFile(
            adminModulePath,
            'jhipster-needle-add-admin-module',
            'EntityAuditModule,'
          );
        }

        // add new menu entry
        this.addElementToAdminMenu('entity-audit', 'list-alt', this.enableTranslation, this.clientFramework);
        if (this.enableTranslation) {
          this.languages.forEach((language) => {
            let menuText = 'Entity Audit';
            try {
              menuText = JSON.parse(fs.readFileSync(`${this.templatePath()}/src/main/webapp/i18n/${language}/global.json`, 'utf8')).global.menu.admin['entity-audit'];
            } catch (e) {
              this.log('Cannot parse file');
            }
            this.addAdminElementTranslationKey('entity-audit', menuText, language);
          });
        }
      },

      registering() {
        try {
          this.registerModule('generator-jhipster-entity-audit', 'entity', 'post', 'entity', 'Add support for entity audit and audit log page');
        } catch (err) {
          this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster post entity creation hook...\n`);
        }
      }
    };
  }


  install() {
    let logMsg =
      `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

    if (this.clientFramework === 'angular1') {
      logMsg =
        `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install & bower install`)}`;
    }
    const injectDependenciesAndConstants = (err) => {
      if (err) {
        this.warning('Install of dependencies failed!');
        this.log(logMsg);
      } else if (this.clientFramework === 'angular1') {
        this.spawnCommand('gulp', ['install']);
      } else if (this.clientFramework === 'angularX') {
        this.spawnCommand(this.clientPackageManager, ['webpack:build']);
      }
    };
    const installConfig = {
      bower: this.clientFramework === 'angular1',
      npm: this.clientPackageManager !== 'yarn',
      yarn: this.clientPackageManager === 'yarn',
      callback: injectDependenciesAndConstants
    };
    if (this.options['skip-install']) {
      this.log(logMsg);
    } else {
      this.installDependencies(installConfig);
    }
  }

  end() {
    this.log(`\n${chalk.bold.green('Auditing enabled for entities, you will have an option to enable audit while creating new entities as well')}`);
    this.log(`\n${chalk.bold.green('I\'m running webpack/gulp now')}`);
  }
};

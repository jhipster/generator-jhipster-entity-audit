const chalk = require('chalk');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const fs = require('fs');
const glob = require('glob');
const _ = require('lodash');

const constants = require('../generator-constants');
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
        this.registerPrettierTransform();
      },
      readConfig() {
        this.jhAppConfig = this.getAllJhipsterConfig();
        this.auditFramework = this.config.get('auditFramework');
        this.auditPage = this.config.get('auditPage');
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
      when: () => this.auditFramework === undefined,
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
      when: () => this.auditFramework === undefined,
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
      when: (response) => this.auditFramework === undefined && response.updateType !== 'all',
      type: 'checkbox',
      name: 'auditedEntities',
      message: 'Please choose the entities to be audited',
      choices: this.existingEntityChoices,
      default: 'none'
    }, {
      when: () => this.auditPage === undefined,
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
    } else if (this.auditFramework === undefined) {
      this.prompt(prompts).then((props) => {
        this.auditFramework = this.auditFramework || props.auditFramework;
        this.updateType = props.updateType;
        this.auditPage = this.auditPage || props.auditPage;
        this.auditedEntities = props.auditedEntities;


        // Check if an invalid database, auditFramework is selected
        if (this.auditFramework === 'custom' && this.jhAppConfig.databaseType === 'mongodb') {
          this.env.error(`${chalk.red.bold('ERROR!')} The JHipster audit framework supports SQL databases only...\n`);
        } else if (this.auditFramework === 'javers' && this.jhAppConfig.databaseType !== 'sql' && this.jhAppConfig.databaseType !== 'mongodb') {
          this.env.error(`${chalk.red.bold('ERROR!')} The Javers audit framework supports only SQL or MongoDB databases...\n`);
        }

        done();
      });
    } else {
      done();
    }
  }

  get writing() {
    return {
      updateYeomanConfig() {
        this.config.set('auditFramework', this.auditFramework);
        this.config.set('auditPage', this.auditPage);
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
        this.skipFakeData = this.jhAppConfig.skipFakeData;
        this.skipServer = this.jhAppConfig.skipServer;
        this.skipClient = this.jhAppConfig.skipClient;
        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();
        this.angularXAppName = this.getAngularXAppName();
        this.changelogDate = this.dateFormatForLiquibase();
        this.jhiPrefix = this.jhAppConfig.jhiPrefix;
        this.jhiPrefixDashed = _.kebabCase(this.jhiPrefix);
        this.jhiTablePrefix = this.getTableName(this.jhiPrefix);

        // use constants from generator-constants.js
        this.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;
        this.javaTemplateDir = 'src/main/java/package';
        this.javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        this.resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        this.interpolateRegex = jhipsterConstants.INTERPOLATE_REGEX;

        // if changelogDate for entity audit already exists then use this existing changelogDate
        const liquibaseFileName = glob.sync(`${this.resourceDir}/config/liquibase/changelog/*_added_entity_EntityAuditEvent.xml`)[0];
        if (liquibaseFileName) {
          this.changelogDate = new RegExp('/config/liquibase/changelog/(.*)_added_entity_EntityAuditEvent.xml').exec(liquibaseFileName)[1];
        }
      },

      writeBaseFiles() {
        if (this.skipServer) return;

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
          },
          {
            from: `${this.javaTemplateDir}/service/dto/_AbstractAuditingDTO.java`,
            to: `${this.javaDir}service/dto/AbstractAuditingDTO.java`
          }
          ];

          genUtils.copyFiles(this, files);

          // add annotations for Javers to ignore fields in 'AbstractAuditingEntity' class
          if (!this.fs.read(`${this.javaDir}domain/AbstractAuditingEntity.java`, {
            defaults: ''
          }).includes('@DiffIgnore')) {
            this.rewriteFile(
              `${this.javaDir}domain/AbstractAuditingEntity.java`,
              'import org.springframework.data.annotation.CreatedBy;',
              'import org.javers.core.metamodel.annotation.DiffIgnore;'
            );
            this.replaceContent(`${this.javaDir}domain/AbstractAuditingEntity.java`, '@JsonIgnore', '@JsonIgnore\n    @DiffIgnore', true);
          }

          // add required third party dependencies
          if (this.buildTool === 'maven') {
            if (this.databaseType === 'mongodb') {
              this.addMavenDependency('org.javers', 'javers-spring-boot-starter-mongo', constants.JAVERS_VERSION);
              this.addMavenDependency('org.mongodb', 'mongo-java-driver', constants.MONGO_DRIVER_VERSION);
            } else if (this.databaseType === 'sql') {
              this.addMavenDependency('org.javers', 'javers-spring-boot-starter-sql', constants.JAVERS_VERSION);
            }
          } else if (this.buildTool === 'gradle') {
            if (this.databaseType === 'mongodb') {
              this.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-mongo', constants.JAVERS_VERSION);
              this.addGradleDependency('compile', 'org.mongodb', 'mongo-java-driver', constants.MONGO_DRIVER_VERSION);
            } else if (this.databaseType === 'sql') {
              this.addGradleDependency('compile', 'org.javers', 'javers-spring-boot-starter-sql', constants.JAVERS_VERSION);
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

            if (!this.skipServer) {
              genUtils.updateEntityAudit.call(this, entityName, jsonObj, this.javaDir, this.resourceDir, false, this.skipFakeData);
            }
          });
        }
      },

      writeAuditPageFiles() {
        // Create audit log page for entities
        if (!this.auditPage) return;

        let files = [];
        if (this.clientFramework === 'angularX' && !this.skipClient) {
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

        if (!this.skipServer) {
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
        }

        if (this.enableTranslation && !this.skipClient) {
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

        if (!this.skipClient) {
          if (this.clientFramework === 'angularX') {
            // add dependency required for displaying diffs
            this.addNpmDependency('ng-diff-match-patch', '2.0.6');
            // based on BaseGenerator.addAdminToModule
            const adminModulePath = `${this.webappDir}app/admin/admin.route.ts`;
            this.rewriteFile(
              adminModulePath,
              'jhipster-needle-add-admin-route',
              ',\n      {\n        path: \'entity-audit\',\n        loadChildren: () => import(\'./entity-audit/entity-audit.module\').then(m => m.EntityAuditModule)\n      }'
            );
          }

          // add new menu entry
          this.addElementToAdminMenu('admin/entity-audit', 'list-alt', this.enableTranslation, this.clientFramework, 'entity-audit');
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
        }
      },

      registering() {
        // Register this generator as a dev dependency
        this.addNpmDevDependency('generator-jhipster-entity-audit', packagejs.version);
        // Register post-app and post-entity hook
        try {
          this.registerModule('generator-jhipster-entity-audit', 'app', 'post', 'app', 'Add support for entity audit and audit log page');
          this.registerModule('generator-jhipster-entity-audit', 'entity', 'post', 'entity', 'Add support for entity audit and audit log page');
        } catch (err) {
          this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster post app and entity creation hook...\n`);
        }
      }
    };
  }


  install() {
    const logMsg = `To install your dependencies manually, run: ${chalk.yellow.bold(`${this.clientPackageManager} install`)}`;

    const injectDependenciesAndConstants = (err) => {
      if (err) {
        this.warning('Install of dependencies failed!');
        this.log(logMsg);
      } else if (this.clientFramework === 'angularX') {
        this.spawnCommand(this.clientPackageManager, ['webpack:build']);
      }
    };
    const installConfig = {
      npm: this.clientPackageManager !== 'yarn',
      yarn: this.clientPackageManager === 'yarn',
      bower: false,
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
    this.log(`\n${chalk.bold.green('I\'m running webpack now')}`);
  }
};

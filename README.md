# generator-jhipster-entity-audit [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> JHipster module to enable entity auditing and to add audit log page

## Usage

This is a [JHipster](http://jhipster.github.io/) module, that is meant to be used in a JHipster application.

You can choose to enable audit for all entities or choose the entities to be audited from a list during generation.

The module will extend the selected entities and its DTOs with `AbstractAuditingEntity` and `AbstractAuditingDTO` class respectively to enable audits, hence make sure that your entities/DTOs doesn't have any super class.

This will also add new columns to the liquibase changeset for the entities, so it is ideal to recreate the tables if you are enabling this for existing entities.

The Audit log page is optional and can be added by choosing the option while running the generator

jhipster-entity-audit module will register itself as a hook for Jhipster and the question to enable audit will available during future entity generation as well

### [BETA] Javers integration

When using sql or mongodb you can use [Javers](http://javers.org/) for entity auditing.

> **BETA Notice** Javers integration is still in beta state. Expect some rough edges!

The module will add [spring-boot integration for javers](http://javers.org/documentation/spring-boot-integration/). Each repository is annotated with the required ``@JaversSpringDataAuditable`` annotation. The new class ``JaversAuthorProvider`` provides javers with the correct user modifying an entity.

### Installation

As this is a [JHipster](http://jhipster.github.io/) module, we expect you have [JHipster and its related tools already installed](http://jhipster.github.io/installation.html).

This module requires Jhipster version greater than 3.0 in order to work

```bash
npm install -g generator-jhipster-entity-audit
```

Then run the module on a JHipster generated application:

```bash
yo jhipster-entity-audit
```

If you want don't want to answer each question you can use

```bash
yo jhipster-entity-audit default
```
This will enable auditing for all available entities (only ones created by the jhipster:entity generator) and add the audit log page under admin

## Using it with JHipster Microservice Architecture

If you choose to use microservice architecture on your project and you still want to get the advantages using _jhipster-entity-audit_ you just need to run the module on the service (not on the gateway!).

To generate the entity audit log page, just answer yes and don't worry with the bower.json and gulpfile errors, it happens because in the service you don't have those files (because it does not have a front-end, the fron-end is in the gateway).

Copy the log page generated files on src/webapp to the same place on your gateway.

You will need to do some minor ajdustments:

1. On the navbar, you will need to include a link to log page (just before jhipster-needle)

    ```html
    <li ui-sref-active="active">
      <a ui-sref="entity-audit" ng-click="vm.collapseNavbar()">
        <span class="glyphicon glyphicon-tasks"></span>&nbsp;
        <span>Entity Audit</span>
      </a>
    </li>
    <!-- jhipster-needle-add-element-to-admin-menu - JHipster will add entities to the admin menu here -->
    ```

2. On the entity-audit.service.js replace:

    ```js
    api/audits/entity/
    ```

    by

    ```js
    <your_service>/api/audits/entity/
    ```

## License

Apache-2.0 © [Deepu KS](http://deepu105.github.io/)

[npm-image]: https://badge.fury.io/js/generator-jhipster-entity-audit.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-entity-audit
[travis-image]: https://travis-ci.org/deepu105/generator-jhipster-entity-audit.svg?branch=master
[travis-url]: https://travis-ci.org/deepu105/generator-jhipster-entity-audit
[daviddm-image]: https://david-dm.org/hipster-labs/generator-jhipster-entity-audit.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/hipster-labs/generator-jhipster-entity-audit

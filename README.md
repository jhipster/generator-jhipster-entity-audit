# generator-jhipster-entity-audit [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url]
> JHipster module to enable entity auditing and to add audit log page

## Usage

This is a [JHipster](http://jhipster.github.io/) module, that is meant to be used in a JHipster application.

You can choose to enable audit for all entities or choose the entities to be audited from a list during generation.

The module will extend the selected entities and its DTOs with `AbstractAuditingEntity` and `AbstractAuditingDTO` class respectively to enable audits, hence make sure that your entities/DTOs doesn't have any super class.

This will also add new columns to the liquibase changeset for the entities, so it is ideal to recreate the tables if you are enabling this for existing entities.

The Audit log page is optional and can be added by choosing the option while running the generator

### Installation

As this is a [JHipster](http://jhipster.github.io/) module, we expect you have [JHipster and its related tools already installed](http://jhipster.github.io/installation.html).

This module requires Jhipster version greater than 2.26.2 in order to work

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

## License

Apache-2.0 © [Deepu KS](http://deepu105.github.io/)

[npm-image]: https://badge.fury.io/js/generator-jhipster-entity-audit.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-entity-audit
[travis-image]: https://travis-ci.org/deepu105/generator-jhipster-entity-audit.svg?branch=master
[travis-url]: https://travis-ci.org/deepu105/generator-jhipster-entity-audit
[daviddm-image]: https://david-dm.org/deepu105/generator-jhipster-entity-audit.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/deepu105/generator-jhipster-entity-audit

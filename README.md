# generator-jhipster-entity-audit

> JHipster blueprint, entity-audit blueprint for JHipster

[![NPM version][npm-image]][npm-url]
[![Generator][github-generator-image]][github-generator-url]
[![Samples][github-samples-image]][github-samples-url]

# Introduction

This is a [JHipster](https://www.jhipster.tech/) blueprint, that is meant to be used in a JHipster application.

You can choose to enable audit for all entities or choose the entities to be audited from a list during generation.

The blueprint will extend the selected entities with `AbstractAuditingEntity` to enable audits, hence make sure that your entities doesn't have any super class.

This will also add new columns to the entities, so it is ideal to recreate the tables if you are enabling this for existing entities or use incremental changelog.

The Audit log page is optional and can be added by choosing the option while running the generator.

### Javers integration

When using sql or mongodb you can use [Javers](http://javers.org/) for entity auditing.

The blueprint will add [spring-boot integration for javers](http://javers.org/documentation/spring-boot-integration/). Each repository is annotated with the required `@JaversSpringDataAuditable` annotation. The new class `JaversAuthorProvider` provides javers with the correct user modifying an entity.

# Prerequisites

As this is a [JHipster](https://www.jhipster.tech/) blueprint, we expect you have JHipster basic knowledge:

- [JHipster](https://www.jhipster.tech/)

# Installation

To install or update this blueprint:

```bash
npm install -g generator-jhipster-entity-audit
```

# Usage

To use this blueprint, run the below command

```bash
jhipster-entity-audit
```

or

```bash
jhipster --blueprints entity-audit
```

You can look for updated entity-audit blueprint specific options by running

```bash
jhipster-entity-audit app --help
```

And looking for `(blueprint option: entity-audit)` like

## JDL

JHipster entity-audit blueprint supports JDL as following

```jdl
application {
  config {
    baseName sample
    blueprints [generator-jhipster-entity-audit]
  }

  config(generator-jhipster-entity-audit) {
    auditFramework javers
  }

  entities *
}

```

## Pre-release

To use an unreleased version, install it using git.

```bash
npm install -g jhipster/generator-jhipster-entity-audit#main
jhipster --blueprints entity-audit --skip-jhipster-dependencies
```

[npm-image]: https://img.shields.io/npm/v/generator-jhipster-entity-audit.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-entity-audit
[github-generator-image]: https://github.com/jhipster/generator-jhipster-entity-audit/actions/workflows/generator.yml/badge.svg
[github-generator-url]: https://github.com/jhipster/generator-jhipster-entity-audit/actions/workflows/generator.yml
[github-samples-image]: https://github.com/jhipster/generator-jhipster-entity-audit/actions/workflows/samples.yml/badge.svg
[github-samples-url]: https://github.com/jhipster/generator-jhipster-entity-audit/actions/workflows/samples.yml

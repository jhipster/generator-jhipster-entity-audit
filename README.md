# generator-jhipster-entity-audit

> JHipster blueprint, entity-audit blueprint for JHipster

[![NPM version][npm-image]][npm-url]
[![Generator](https://github.com/hipster-labs/generator-jhipster-entity-audit/actions/workflows/generator.yml/badge.svg)](https://github.com/hipster-labs/generator-jhipster-entity-audit/actions/workflows/generator.yml)
[![Integration Test](https://github.com/hipster-labs/generator-jhipster-entity-audit/actions/workflows/github-ci.yml/badge.svg)](https://github.com/hipster-labs/generator-jhipster-entity-audit/actions/workflows/github-ci.yml)

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

As this is a [JHipster](https://www.jhipster.tech/) blueprint, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://www.jhipster.tech/installation/)

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

And looking for `(blueprint option: entity-audit)` options.

## Pre-release

To use an unreleased version, install it using git.

```bash
npm install -g hipster-labs/generator-jhipster-entity-audit#main
jhipster --blueprints entity-audit --skip-jhipster-dependencies
```

[npm-image]: https://img.shields.io/npm/v/generator-jhipster-entity-audit.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-entity-audit

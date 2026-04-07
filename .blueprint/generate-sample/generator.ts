import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

import { getGithubSamplesGroup } from 'generator-jhipster/ci';
import BaseGenerator from 'generator-jhipster/generators/base-core';

export default class extends BaseGenerator {
  samplesFolder?: string;
  samplesGroup!: string;
  sampleName!: string;
  all?: boolean;
  sampleType?: string;
  sampleFile?: string;
  generatorOptions: any;

  get [BaseGenerator.WRITING]() {
    return this.asAnyTaskGroup({
      async copySample() {
        const { samplesFolder, samplesGroup, all, sampleName } = this;
        const samplesPath = samplesFolder ? join(samplesFolder, samplesGroup) : samplesGroup;
        if (all) {
          this.copyTemplate(`${samplesPath}/*.jdl`, '');
          this.sampleType = 'jdl';
        } else if (extname(sampleName) === '.jdl') {
          this.copyTemplate(join(samplesPath, sampleName), sampleName, { noGlob: true });
          this.sampleType = 'jdl';
        } else {
          const { samples } = await getGithubSamplesGroup(this.templatePath(), samplesPath);
          const {
            'sample-type': sampleType,
            'sample-file': sampleFile = sampleName,
            'sample-folder': sampleFolder = samplesPath,
            generatorOptions,
            templateOptions = {},
          } = samples[sampleName] as any;

          this.generatorOptions = generatorOptions;
          this.sampleType = sampleType === 'jdl-ejs' ? 'jdl' : sampleType;

          if (sampleType === 'jdl') {
            const jdlFile = `${sampleFile}.jdl`;
            this.copyTemplate(join(sampleFolder, jdlFile), jdlFile, { noGlob: true });
          } else if (sampleType === 'jdl-ejs') {
            const jdlFile = `${sampleFile}.jdl`;
            this.renderTemplate(join(sampleFolder, `${jdlFile}.ejs`), jdlFile, templateOptions, { noGlob: true });
          } else if (sampleType === 'yo-rc') {
            this.copyTemplate('**', '', {
              fromBasePath: this.templatePath(sampleFolder, sampleFile),
              globOptions: { dot: true },
            });
          }
        }
      },
    });
  }

  get [BaseGenerator.END]() {
    return this.asAnyTaskGroup({
      async generateYoRcSample() {
        if (this.sampleType !== 'yo-rc') return;

        const generatorOptions = this.getDefaultComposeOptions();
        await this.composeWithJHipster('app', { generatorOptions });
      },
      async generateJdlSample() {
        if (this.sampleType !== 'jdl') return;

        const generatorOptions = this.getDefaultComposeOptions();
        const folderContent = await readdir(this.destinationPath());
        const jdlFiles = folderContent.filter(file => file.endsWith('.jdl'));

        await this.composeWithJHipster('jdl', {
          generatorArgs: jdlFiles,
          generatorOptions: {
            ...generatorOptions,
            ...(this.all ? { workspaces: true, monorepository: true } : { skipInstall: true }),
          },
        });
      },
      async jhipsterInfo() {
        await this.composeWithJHipster('info');
      },
    });
  }

  getDefaultComposeOptions() {
    const packageJson = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), { encoding: 'utf-8' }));
    const projectVersion = `${packageJson.version}-git`;
    return {
      skipJhipsterDependencies: true,
      projectVersion,
      ...this.generatorOptions,
    };
  }
}

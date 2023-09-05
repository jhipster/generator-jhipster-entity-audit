import BaseGenerator from 'generator-jhipster/generators/base';
import command from './command.mjs';

export default class extends BaseGenerator {
  sampleName;

  get [BaseGenerator.INITIALIZING]() {
    return this.asInitializingTaskGroup({
      async initializeOptions() {
        this.parseJHipsterArguments(command.arguments);
        if (!this.sampleName.endsWith('.jdl')) {
          this.sampleName += '.jdl';
        }
        this.parseJHipsterOptions(command.options);
      },
    });
  }

  get [BaseGenerator.WRITING]() {
    return this.asWritingTaskGroup({
      async copySample() {
        this.copyTemplate(`samples/${this.sampleName}`, this.sampleName, { noGlob: true });
      },
    });
  }

  get [BaseGenerator.END]() {
    return this.asEndTaskGroup({
      async generateSample() {
        await this.composeWithJHipster('jdl', {
          generatorArgs: [this.sampleName],
          generatorOptions: {
            skipJhipsterDependencies: true,
            insight: false,
            skipChecks: true,
            skipInstall: true,
          },
        });
      },
    });
  }
}

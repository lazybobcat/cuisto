#!/usr/bin/env node

import {Command} from 'commander';
import ora from 'ora';

import {hello} from './src/hello';

const metadata = await import('./package.json', {with: {type: 'json'}});

const program = new Command();
program
    .version(metadata.default.version, '-v, --version')
    .description('Install and update your project based on recipes, cuisto will bake them for you!')
    .option('-t, --test <value>', 'Say hello')
    .parse(process.argv);

const options = program.opts();
if (options.test) {
    const spinner = ora('Loading unicorns').start();
    setTimeout(() => {
        spinner.succeed();
        console.log(hello(options.test));
    }, 1000);
} else {
    console.warn('Ah ouais, tu dis pas bonjour?');
}

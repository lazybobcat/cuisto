#!/usr/bin/env node

import {printError, printInfo} from '@lazybobcat/cuisto-api';
import {Command} from 'commander';
import {cosmiconfig} from 'cosmiconfig';
import {dirname} from 'node:path';
import {execa} from 'execa';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';

import {installAction} from './lib/install.action';

function increaseVerbosity(_: string, previous: number): number {
    return previous + 1;
}

function aggregateProperties(v: string, acc: { [name: string]: string | undefined }): { [name: string]: string | undefined } {
    const [name, value] = v.split('=');
    if (name) {
        acc[name] = value;
    }

    return acc;
}

/*****************/
const metadata = await import('../package.json', {with: {type: 'json'}});
process.env['RECIPE_DEPENDENCIES'] = JSON.stringify(metadata.default.dependencies);
const dirPath = fs.realpathSync('.');
const cliPath = dirname(fileURLToPath(import.meta.url));
/*****************/
const explorer = cosmiconfig('cuisto');
const configuration = await explorer.search() || {config: {}, filepath: dirPath};
configuration.config.recipe_sources = [...configuration?.config.recipe_sources || [], 'git@github.com:'];
/*****************/

const program = new Command();
program
    .version(metadata.default.version, '--version')
    .description('Install and update your project based on recipes, cuisto will bake them for you!');


program.command('init')
    .description('Initialize a new project with a .cuistorc.json file')
    .argument('[projectName]', 'The name of the project')
    .option('-v, --verbose', 'Prints additional information during the execution of the command', increaseVerbosity, 0)
    .action(async (projectName: string | undefined, options: {verbose: number}) => {
        const recipe = `${cliPath}/recipes/init`;
        let properties = {};
        if (projectName) {
            properties = {projectName: projectName};
        }
        await installAction(recipe, '', dirPath, {property: properties, yes: true, dryRun: false, verbose: options.verbose}, configuration);
    });

program.command('new-recipe')
    .description('Initialize code and configuration files for a new cuisto recipe')
    .argument('[recipeName]', 'The name of the recipe')
    .option('-v, --verbose', 'Prints additional information during the execution of the command', increaseVerbosity, 0)
    .action(async (recipeName: string | undefined, options: {verbose: number}) => {
        const recipe = `${cliPath}/recipes/new-recipe`;
        let properties = {};
        if (recipeName) {
            properties = {recipeName: recipeName};
        }
        await installAction(recipe, '', dirPath, {property: properties, yes: true, dryRun: false, verbose: options.verbose}, configuration);
    });

program.command('install')
    .alias('i')
    .description('Install the given recipe')
    .argument('<recipe>', 'The git repository short name of the recipe, depending on your "recipe_sources" configuration in .cuistorc.json')
    .argument('[branch]', 'The branch or tag to install, default to "main"', 'main')
    .option('-p, --property <name>=<value>', 'Set a property for the recipe', aggregateProperties, {})
    .option('-y, --yes', 'Non interactive mode', false)
    .option('-v, --verbose', 'Prints additional information during the execution of the command', increaseVerbosity, 0)
    .option('--dry-run, --dryRun', 'Preview the changes without updating the project', false)
    .action(async (
        recipe: string,
        branch: string,
        options: { property: { [name: string]: string }, yes: boolean, verbose: number, dryRun: boolean }
    ) => {
        await installAction(recipe, branch, dirPath, options, configuration);
    });

program.parse(process.argv);

/**
 * This handler is called when an uncaught exception occurs. It will print a message to the user and provide information
 * about the environment and the error that occurred.
 */
process.setUncaughtExceptionCaptureCallback(async error => {
    const recipe = process.env['RECIPE_NAME'] || 'unknown';
    const dependencies: {[dep: string]: string} = JSON.parse(process.env['RECIPE_DEPENDENCIES'] || '') || {};
    const npm = await execa('npm', ['--version']);

    const message = error instanceof Error ? (error?.stack ?? error.message) : String(error);
    printError(`An error occurred while executing the recipe "${recipe}".`);
    console.error(`\n[ERROR] ${message}`);

    console.log('\n'); // Add a line break to separate the error message from the previous output
    printInfo('If you consider opening an issue, please provide the following information:');
    console.log(`
Cuisto:\t${metadata.default.version}
Node:\t${process.version}
OS:\t${process.platform}
npm:\t${npm.stdout}
`);

    for (const [name, version] of Object.entries(dependencies)) {
        console.log(`${name}: ${version}`);
    }

    process.exit(1);
});


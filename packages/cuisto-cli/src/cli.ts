#!/usr/bin/env node

import {Command} from 'commander';

import {VirtualFS, Yaml, verbose} from '@lazybobcat/cuisto-api';
import {dirname, join} from 'node:path';
import {cosmiconfig} from 'cosmiconfig';
import {execa} from 'execa';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';

import {printError, printInfo} from './lib/output';
import {installAction} from './lib/install.action';

function increaseVerbosity(_: string, previous: number): number {
    return previous + 1;
}

/*****************/
const metadata = await import('../package.json', {with: {type: 'json'}});
process.env['RECIPE_DEPENDENCIES'] = JSON.stringify(metadata.default.dependencies);
/*****************/
const explorer = cosmiconfig('cuisto');
const configuration = await explorer.search();
/*****************/
const dirPath = fs.realpathSync('.');
const cliPath = dirname(fileURLToPath(import.meta.url));
process.env['NODE_PATH'] = join(cliPath, 'node_modules', '@lazybobcat', 'cuisto-api');
/*****************/

const program = new Command();
program
    .version(metadata.default.version, '--version')
    .description('Install and update your project based on recipes, cuisto will bake them for you!')
    .option('-i, --init', 'Initialize a new cuisto project'); // TODO: implement the init command

program.command('install')
    .alias('i')
    .description('Install the given recipe')
    .argument('<recipe>', 'The git repository short name of the recipe, depending on your "recipe_sources" configuration in .cuistorc.json')
    .argument('[branch]', 'The branch or tag to install, default to "main"', 'main')
    .option('-p, --property <name>=<value>', 'Set a property for the recipe', (v, acc: { [name: string]: string | undefined }) => {
        const [name, value] = v.split('=');
        if (name) {
            acc[name] = value;
        }

        return acc;
    }, {})
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

program.command('test')
    .option('-v, --verbose', 'Prints additional information during the execution of the command', increaseVerbosity, 0)
    .option('-y, --yes', 'Non interactive mode', false)
    .option('--dry-run, --dryRun', 'Preview the changes without updating the project', false)
    .action(async (options: { verbose: number, yes: boolean, dryRun: boolean }) => {
        const vfs = new VirtualFS(dirPath, options.verbose);
        const doc = Yaml.parse<any>(vfs.read('docker-compose.yaml', 'utf-8') || '');
        doc.volumes = {
            name: 'test'
        };
        console.log(doc);

        vfs.write('docker-compose.out.yaml', Yaml.stringify(doc));
        console.log(vfs.tree());
    });


program.parse(process.argv);

/**
 * This handler is called when an uncaught exception occurs. It will print a message to the user and provide information
 * about the environment and the error that occurred.
 */
process.setUncaughtExceptionCaptureCallback(async error => {
    const verbosity = Number(process.env['VERBOSE']) || 0;
    const recipe = process.env['RECIPE_NAME'] || 'unknown';
    const dependencies: {[dep: string]: string} = JSON.parse(process.env['RECIPE_DEPENDENCIES'] || '') || {};
    const npm = await execa('npm', ['--version']);
    if (verbosity > 0) {
        verbose(error instanceof Error ? error.message : String(error), {verbose: verbosity});
        printError(`An error occurred while executing the recipe "${recipe}".`);
    } else {

        printError(`An error occurred while executing the recipe "${recipe}". Please run the command with the --verbose option to get more information.`);
    }

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
});


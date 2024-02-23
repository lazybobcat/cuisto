#!/usr/bin/env node

import {Command} from 'commander';

import {VirtualFS, applyChanges, error, spinner, verbose} from '@lazybobcat/cuisto-api';
import {confirm} from '@inquirer/prompts';
import fs from 'node:fs';

function increaseVerbosity(_: string, previous: number): number {
    return previous + 1;
}

const metadata = await import('../package.json', {with: {type: 'json'}});

/*****************/
const hello = (name: string) => `Hello ${name}!`;
const dirpath = fs.realpathSync('.');
const recipesPath = '/media/dev/www/cuisto/recipes';

/*****************/

const program = new Command();
program
    .version(metadata.default.version, '--version')
    .description('Install and update your project based on recipes, cuisto will bake them for you!')
    .option('-t, --test <value>', 'Say hello')
    .option('-i, --init', 'Initialize a new cuisto project')
    .option('-m, --module <recipe>', 'Dynamically import and execute a recipe');
type Options = {
    verbose: number;
    test: string;
    init: boolean;
}

program.command('install <recipe> [version]')
    .alias('i')
    .description('Install the given recipe')
    .option('-v, --verbose', 'Prints additional information during the execution of the command', increaseVerbosity, 0)
    .option('--dry-run, --dryRun', 'Preview the changes without updating the project', false)
    .action(async (recipe: string, version: string, options: {verbose: number, dryRun: boolean}) => {
        console.log(`🍱 Cooking ${recipe}...`);

        // Version
        version = version || 'default';
        const path = `${recipesPath}/${recipe}/${version}`;

        let schema: {main: string} | undefined = undefined;

        // Load the "schema.json" file from the given recipe
        try {
            const data = fs.readFileSync(`${path}/schema.json`, 'utf8');
            schema = JSON.parse(data);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), options);
            console.log(error(`The recipe ${recipe} does not exist.`));
            process.exit(1);
        }

        if (!schema?.main) {
            verbose(JSON.stringify(schema), options);
            console.log(error('No main file found in the recipe schema.'));
            process.exit(1);
        }

        // Execute the main file
        try {
            const r = await import(`${path}/${schema.main}`);
            await r.default();
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), options);
            console.log(error(`The recipe could not be executed. Check that ${recipe}/${schema.main} exists and exports a default function.`));
            process.exit(1);
        }
    });

program.command('test')
    .option('-v, --verbose', 'Prints additional information during the execution of the command', increaseVerbosity, 0)
    .option('-y, --yes', 'Non interactive mode', false)
    .option('--dry-run, --dryRun', 'Preview the changes without updating the project', false)
    .action(async (options: {verbose: number, yes: boolean, dryRun: boolean}) => {
        const vfs = new VirtualFS(dirpath, options.verbose);

        vfs.write('dist/hello.txt', 'Hello World!');
        vfs.write('toto.txt', 'tata');

        vfs.rename('dist/hello.txt', 'dist2/hello.txt');
        // console.log(vfs.tree());

        vfs.delete('toto.txt');
        console.log(vfs.tree());

        if (!options.dryRun) {
            const answer = options.yes || await confirm({message: 'Do you want to write these files in your project?', default: false});
            if (answer) {
                await applyChanges(vfs, options.verbose);
            }
        }
    });


program.parse(process.argv);

const options = program.opts<Options>();
if (options['test']) {
    const progress = spinner('Loading unicorns...').start();
    setTimeout(() => {
        progress.succeed();
        console.log(hello(options['test']));
    }, 1000);
}

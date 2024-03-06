#!/usr/bin/env node

import {Command} from 'commander';

import {VirtualFS, Yaml, printError, printInfo, printSuccess, verbose} from '@lazybobcat/cuisto-api';
import {confirm} from '@inquirer/prompts';
import fs from 'node:fs';

import {Properties, applyChanges, askProperties, doesRecipeContainDangerousCode} from './lib/cuisto-cli';

function increaseVerbosity(_: string, previous: number): number {
    return previous + 1;
}

const metadata = await import('../package.json', {with: {type: 'json'}});

/*****************/
const dirpath = fs.realpathSync('.');
const recipesPath = '/media/dev/www/cuisto/recipes';

/*****************/

const program = new Command();
program
    .version(metadata.default.version, '--version')
    .description('Install and update your project based on recipes, cuisto will bake them for you!')
    .option('-i, --init', 'Initialize a new cuisto project'); // TODO: implement the init command

program.command('install <recipe> [version]')
    .alias('i')
    .description('Install the given recipe')
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
        version: string,
        options: { property: { [name: string]: string }, yes: boolean, verbose: number, dryRun: boolean }
    ) => {
        printInfo(`🍳 Cooking ${recipe}...`, false);

        // Version
        version = version || 'default';
        const path = `${recipesPath}/${recipe}/${version}`;
        verbose(`Check recipe at path ${path}`, options);

        let schema: { main: string, properties: Properties } | undefined = undefined;

        // Load the "schema.json" file from the given recipe
        try {
            const data = fs.readFileSync(`${path}/schema.json`, 'utf8');
            schema = JSON.parse(data);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), options);
            printError(`The recipe ${recipe} does not exist.`);
            process.exit(1);
        }

        if (!schema?.main) {
            verbose(JSON.stringify(schema), options);
            printError('No main file found in the recipe schema.');
            process.exit(1);
        }

        try {
            fs.readFileSync(`${path}/${schema.main}`, 'utf8');
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), options);
            printError(`The main file ${schema.main} does not exist in the recipe.`);
            process.exit(1);
        }

        if (doesRecipeContainDangerousCode(path, options)) {
            printError('The recipe contains dangerous code.');
            // the user should be warned and asked if they want to continue
            const answer = await confirm({message: 'Do you want to continue anyway?', default: false});
            if (!answer) {
                process.exit(1);
            }
        }

        // Execute the main file
        try {
            const vfs = new VirtualFS(dirpath, options.verbose);
            const r = await import(`${path}/${schema.main}`);

            // define environment variables that can be used in the recipe
            process.env['DRY_RUN'] = options.dryRun ? 'true' : 'false';
            process.env['VERBOSE'] = String(options.verbose);
            process.env['RECIPE_NAME'] = recipe;

            // Extract properties from the schema and ask the user to fill it interactively
            const properties = await askProperties(schema.properties, options.property, options);

            // Execute the recipe
            await r.default({
                vfs,
                properties,
            });

            // If there are changes to the vfs, merge them
            if (!options.dryRun && vfs.hasChanges()) {
                console.log(vfs.tree());
                const answer = options.yes || await confirm({message: 'Do you want to write these files in your project?', default: false});
                if (answer) {
                    await applyChanges(vfs, options.verbose);
                }
            }

            printSuccess(`The recipe ${recipe} has been successfully executed!`);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), options);
            printError(`An error occurred while executing the recipe ${recipe}. Please run the command with the --verbose option to get more information.`);
            process.exit(1);
        }
    });

program.command('test')
    .option('-v, --verbose', 'Prints additional information during the execution of the command', increaseVerbosity, 0)
    .option('-y, --yes', 'Non interactive mode', false)
    .option('--dry-run, --dryRun', 'Preview the changes without updating the project', false)
    .action(async (options: { verbose: number, yes: boolean, dryRun: boolean }) => {
        const vfs = new VirtualFS(dirpath, options.verbose);
        const doc = Yaml.parse<any>(vfs.read('docker-compose.yaml', 'utf-8') || '');
        doc.volumes = {
            name: 'test'
        };
        console.log(doc);

        vfs.write('docker-compose.out.yaml', Yaml.stringify(doc));
        console.log(vfs.tree());
        applyChanges(vfs, options.verbose);
    });


program.parse(process.argv);


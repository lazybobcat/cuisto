import {VirtualFS, outputFile, verbose} from '@lazybobcat/cuisto-api';
import {Ora} from 'ora';
import {confirm} from '@inquirer/prompts';
import fs from 'node:fs';
import {join} from 'node:path';
import {rm} from 'node:fs/promises';

import {FlatProperties, Properties, askProperties} from './ask-properties';
import {asyncTask, info, printError, printSuccess, printWarning} from './output';
import {doesRecipeContainDangerousCode} from './recipe-analyser';

// TODO: fetch recipes on github/gitlab
const recipesPath = '/media/dev/www/cuisto/recipes';

type Schema = { main: string; properties: Properties; };
type Options = { property: { [name: string]: string; }; yes: boolean; verbose: number; dryRun: boolean; };

export async function installAction(
    recipe: string,
    version: string,
    executionPath: string,
    options: Options
) {
    // define environment variables that can be used in the recipe
    process.env['DRY_RUN'] = options.dryRun ? 'true' : 'false';
    process.env['VERBOSE'] = String(options.verbose);
    process.env['RECIPE_NAME'] = recipe;

    const path = `${recipesPath}/${recipe}/${version}`;
    const vfs = new VirtualFS(executionPath, options.verbose);

    const schema = await asyncTask(
        loadSchema(recipe, version, path, options),
        info(`📖 Looking for the recipe "${recipe}"...`, false)
    );
    await asyncTask(
        spinner => checkDangerousCode(path, options, spinner),
        info('🍪 Checking the diet...', false)
    );
    const properties = await asyncTask(
        spinner => askProperties((schema as Schema).properties, options.property, options, spinner),
        info('🍄 Gathering ingredients...\n', false)
    );

    // Execute the recipe
    await asyncTask(
        spinner => executeRecipe(vfs, path, schema, properties, options, spinner),
        info(`🍳 Cooking "${recipe}"...`, false)
    );

    printSuccess('The recipe has been successfully executed!');
}

async function loadSchema(recipe: string, version: string, path: string, options: Options): Promise<Schema> {
    // Version
    version = version || 'default';
    verbose(`Check recipe at path ${path}`, options);

    let schema: { main: string; properties: Properties; } | undefined = undefined;
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

    return schema;
}

async function checkDangerousCode(path: string, options: Options, spinner: Ora): Promise<void> {
    if (doesRecipeContainDangerousCode(path, options)) {
        spinner.warn();
        printWarning('The recipe contains dangerous code.');
        // the user should be warned and asked if they want to continue
        const answer = await confirm({message: 'Do you want to continue anyway?', default: false});
        if (!answer) {
            process.exit(1);
        }
    }
}

async function executeRecipe(
    vfs: VirtualFS,
    path: string,
    schema: Schema,
    properties: FlatProperties,
    options: Options,
    progress: Ora
) {
    const recipe = await import(`${path}/${schema.main}`);
    await recipe.default({
        vfs,
        properties,
        recipePath: path,
    });

    if (!options.dryRun && vfs.hasChanges()) {
        progress.stopAndPersist();
        console.log(vfs.tree());
        const answer = options.yes || await confirm({message: 'Do you want to write these files in your project?', default: false});
        if (answer) {
            progress.start();
            await applyChanges(vfs, options.verbose);
        } else {
            progress.fail();
            printWarning('The changes have not been applied!');
            process.exit(2);
        }
    }
}

const applyChanges = async (vfs: VirtualFS, verboseLevels = 1): Promise<void> => {
    for (const [path, change] of Object.entries(vfs.changes())) {
        try {
            const fullPath = join(vfs.root, path);

            if ('CREATE' === change.operation) {
                await asyncTask(outputFile(fullPath, change.content || '', {mode: change.mode}), `Creating ${path}...`);
            }

            if ('UPDATE' === change.operation) {
                await asyncTask(outputFile(fullPath, change.content || '', {mode: change.mode}), `Updating ${path}...`);
            }

            if ('DELETE' === change.operation) {
                await asyncTask(rm(fullPath, {recursive: true, force: true}), `Deleting ${path}...`);
            }

            vfs.changeApplied(path);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: verboseLevels});
        }
    }
};


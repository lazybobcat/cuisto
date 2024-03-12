import {VirtualFS, outputFile, verbose} from '@lazybobcat/cuisto-api';
import {dirname, join} from 'node:path';
import fs, {mkdirSync, rmSync} from 'node:fs';
import {CosmiconfigResult} from 'cosmiconfig';
import {Ora} from 'ora';
import {confirm} from '@inquirer/prompts';
import {execa} from 'execa';
import {homedir} from 'node:os';
import {rm} from 'node:fs/promises';
import {xdgData} from 'xdg-basedir';

import {FlatProperties, Properties, askProperties} from './ask-properties';
import {asyncTask, info, printError, printSuccess, printWarning} from './output';
import {doesRecipeContainDangerousCode} from './recipe-analyser';
import {findRepositoryUrl} from './git-operations';

// TODO: fetch recipes on github/gitlab
const dataDir = xdgData || join(homedir(), '.local', 'share');
const recipesPath = join(dataDir, 'cuisto', 'recipes');

type Schema = { main: string; properties: Properties; };
type Options = { property: { [name: string]: string; }; yes: boolean; verbose: number; dryRun: boolean; };

export async function installAction(
    recipe: string,
    branch: string,
    executionPath: string,
    options: Options,
    configuration: CosmiconfigResult
) {
    // define environment variables that can be used in the recipe
    process.env['DRY_RUN'] = options.dryRun ? 'true' : 'false';
    process.env['VERBOSE'] = String(options.verbose);
    process.env['RECIPE_NAME'] = recipe;

    if (null === configuration) {
        // @TODO: remove this error when github will be the default recipe source
        printError('No configuration found. Please provite a .cuistorc.json file in the project.');
        process.exit(1);
    }

    const recipeSources = configuration.config.recipe_sources || [];
    let path = `${recipesPath}/${recipe}/${branch}`;
    const vfs = new VirtualFS(executionPath, options.verbose);

    if ((recipe.startsWith('.') || recipe.startsWith('/')) && fs.existsSync(recipe)) {
        path = recipe;
    } else {
        await asyncTask(
            cloneRecipe(recipe, branch, path, recipeSources, options),
            info(`📖 Looking for the recipe "${recipe}"...`, false)
        );
    }
    const schema = await asyncTask(
        loadSchema(recipe, branch, path, recipeSources, options),
        info(`🌱 Loading the recipe "${recipe}"...`, false)
    );
    await asyncTask(
        spinner => checkDangerousCode(path, options, spinner),
        info('🍪 Checking the diet...', false)
    );
    const properties = await asyncTask(
        spinner => askProperties((schema as Schema).properties, options.property, options, spinner),
        info('🍄 Gathering ingredients...', false)
    );

    // Execute the recipe
    await asyncTask(
        spinner => executeRecipe(vfs, path, schema, properties, options, spinner),
        info(`🍳 Cooking "${recipe}"...`, false)
    );

    printSuccess('The recipe has been successfully executed!');
}

async function cloneRecipe(recipe: string, branch: string, path: string, recipeSources: string[], options: Options): Promise<void> {
    // Scan recipe sources to find the recipe in a git repository:
    const url = await findRepositoryUrl(recipeSources, recipe, branch);
    if (null === url) {
        printError(`The recipe "${recipe}" with branch "${branch}" could not be found in any of the "recipe_sources" defined in the ".cuistorc.json" configuration file.`);
        process.exit(1);
    }
    // Create the directory if it does not exist
    if (!fs.existsSync(dirname(path))) {
        verbose(`Create directory ${dirname(path)}`, options);
        mkdirSync(dirname(path), {recursive: true});
    }
    if (fs.existsSync(path)) {
        verbose(`Remove directory ${path}`, options);
        rmSync(path, {recursive: true, force: true});
    }
    // Execute git command to clone the recipe with depth=1 and branch=branch
    {
        verbose(`Clone recipe from ${url} to ${path}`, options);
        const {stdout} = await execa('git', ['clone', '--depth=1', '--branch', branch, url, path]);
        verbose(stdout, options);
    }
    // Install npm dependencies
    {
        verbose(`Install npm dependencies in ${path}`, options);
        const {stdout} = await execa('npm', ['--prefix', path, 'install']);
        verbose(stdout, options);
    }
}

async function loadSchema(recipe: string, branch: string, path: string, recipeSources: string[], options: Options): Promise<Schema> {
    // Check if the recipe exists locally
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

    verbose(`Schema loaded: ${path}/schema.json`, options);

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
    verbose(`Execute recipe from ${path}/${schema.main}`, options);
    const recipe = await import(`${path}/${schema.main}`);
    await recipe.default({
        vfs,
        properties,
        recipePath: path,
    });

    if (!options.dryRun && vfs.hasChanges()) {
        if (!options.yes) {
            progress.stopAndPersist();
            console.log(vfs.tree());
        }
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


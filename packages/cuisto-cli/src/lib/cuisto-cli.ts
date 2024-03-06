import {VirtualFS, outputFileSync, spinner, verbose} from '@lazybobcat/cuisto-api';
import {checkbox, confirm, input, select} from '@inquirer/prompts';
import {lstatSync, readFileSync} from 'fs';
import {readdirSync, rmSync} from 'node:fs';
import {join} from 'path';

/**
 * @internal
 */
export const applyChanges = async (vfs: VirtualFS, verboseLevels = 1): Promise<void> => {
    for (const [path, change] of Object.entries(vfs.changes())) {
        const progress = spinner(`Applying changes to ${path}...`).start();

        try {
            const fullPath = join(vfs.root, path);

            if ('CREATE' === change.operation) {
                progress.text = `Creating ${path}...`;
                outputFileSync(fullPath, change.content || '', {mode: change.mode});
            }

            if ('UPDATE' === change.operation) {
                progress.text = `Updating ${path}...`;
                outputFileSync(fullPath, change.content || '', {mode: change.mode});
            }

            if ('DELETE' === change.operation) {
                progress.text = `Deleting ${path}...`;
                rmSync(fullPath, {recursive: true, force: true});
            }

            vfs.changeApplied(path);
            progress.succeed(`${progress.text} Done!`);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: verboseLevels});
            progress.fail(`An error occurred while applying the changes to ${path}`);
        }
    }
};

export const doesRecipeContainDangerousCode = (recipePath: string, options: {verbose: number}): boolean => {
    const dangerousCommands = [
        'sudo',
        'exec',
    ];
    const dangerousImportRxp = /(import|require)(.*)(node:|fs|child_process)/;

    // iterates on files in the recipe:
    for (const path of readdirSync(recipePath)) {
        const filePath = join(recipePath, path);
        const file = lstatSync(filePath);
        if (file.isDirectory()) {
            return path !== 'node_modules' ? doesRecipeContainDangerousCode(filePath, options) : false;
        }

        const content = readFileSync(filePath, 'utf8');
        for (const dangerousCommand of dangerousCommands) {
            if (content.includes(dangerousCommand)) {
                verbose(`Recipe file ${filePath} contains dangerous command "${dangerousCommand}"`, options);

                return true;
            }
        }
        if (dangerousImportRxp.test(content)) {
            verbose(`Recipe file ${filePath} contains dangerous import`, options);

            return true;
        }
    }

    return false;
};

type Property =
    | {
        type: 'string' | 'number';
        description: string;
        default?: string;
        required?: boolean;
    }
    | {
        type: 'boolean';
        description: string;
        default?: boolean;
        required?: boolean;
    }
    | {
        type: 'choice';
        description: string;
        choices: { name?: string; value: string }[];
        multiple?: false;
        default?: string;
        required?: boolean;
    }
    | {
        type: 'choice';
        description: string;
        choices: { name?: string; value: string }[];
        multiple: true;
        required?: boolean;
    }
;

export type Properties = {
    [property: string]: Property;
};

const notEmpty = (value: string) => value.trim().length > 0;

export const askProperties = async (
    properties: Properties,
    providedValues: {[name: string]: string | undefined},
    options: {yes: boolean, verbose: number}
): Promise<{ [property: string]: string | number | boolean | string[] }> => {
    const answers: { [property: string]: string | number | boolean | string[] } = {};

    for (const [property, definition] of Object.entries(properties)) {
        let result: string | number | boolean | string[] | undefined;

        // If the value has been provided as an option, we set it and continue
        if (property in providedValues) {
            const r = providedValues[property];
            if (r) {
                answers[property] = r;
                continue;
            }
        }

        // If yes is true and the property has a default value, we set it and continue
        if (options.yes) {
            if ('default' in definition && undefined !== definition.default) {
                result = definition.default;
                answers[property] = result;
                continue;
            }
            if (true !== definition.required) {
                continue;
            }
        }

        switch (definition.type) {
            case 'string':
            case 'number':
                result = await input({message: definition.description, default: definition.default, validate: definition.required ? notEmpty : undefined});
                answers[property] = result;
                break;

            case 'boolean':
                result = await confirm({message: definition.description, default: definition.default});
                answers[property] = result;
                break;

            case 'choice':
                if (definition.multiple) {
                    result = await checkbox({message: definition.description, choices: definition.choices});
                    answers[property] = result;
                } else {
                    result = await select({message: definition.description, choices: definition.choices, default: definition.default});
                    answers[property] = result;
                }
                break;
        }
        verbose(`Property ${property} set to ${result}`, {verbose: options.verbose});
    }

    return answers;
};


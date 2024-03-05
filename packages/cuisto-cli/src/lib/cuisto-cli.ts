import {VirtualFS, outputFileSync, spinner, verbose} from '@lazybobcat/cuisto-api';
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


import {confirm} from '@inquirer/prompts';
import {execaCommand} from 'execa';

import {spinner, verbose} from './output';

const dangerousCommands = [
    'sudo',
    'rm',
    'rmdir',
    'unlink',
    'mv',
    'cp',
    'chmod',
    'chown',
    'chgrp',
    'dd',
    'mkfs',
    'mke2fs',
    'mkfs.ext2',
    'mkfs.ext3',
    'mkfs.ext4',
    '>', '>>',
];

export class Command {
    /**
     * Execute a command.
     * @param command The command to execute.
     * @param dryRun If true, the command will not be executed.
     * @returns The stdout of the command.
     */
    static async run(command: string, dryRun = false): Promise<string> {
        dryRun = 'true' === process.env['DRY_RUN'] || dryRun;
        const verbosity = Number(process.env['VERBOSE']) || 0;

        // check if command has a dangerous bit in it
        for (const dangerousCommand of dangerousCommands) {
            if (command.includes(dangerousCommand)) {
                console.warn(`The recipe contains the following dangerous command: "${command}".`);
                const answer = await confirm({message: 'Do you want to execute it and continue?', default: false});
                if (!answer) {
                    throw new Error(`Command "${command}" is dangerous and will not be executed`);
                }
            }
        }

        const progress = spinner(`Executing command "${command}"`);
        if (!dryRun) {
            progress.render();
            const promise = await execaCommand(command);
            if (promise.failed) {
                progress.fail();
                if (undefined !== promise.all) {
                    verbose(promise.all, {verbose: verbosity});
                }
                throw new Error(`Command "${command}" failed`);
            }

            progress.succeed();

            return promise.stdout;
        }

        progress.prefixText = '[DRY RUN]';
        progress.succeed();

        return '';
    }
}


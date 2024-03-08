import {execaCommand} from 'execa';

import {verbose} from './verbose';

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

        return this.doRun(command, dryRun, verbosity);
    }

    private static async doRun(command: string, dryRun: boolean, verbosity: number): Promise<string> {
        const suffix = dryRun ? ' (dry run)' : '';
        verbose(`Running command: "${command}"${suffix}`, {verbose: verbosity});

        if (!dryRun) {
            const promise = await execaCommand(command);
            if (promise.failed) {
                if (undefined !== promise.all) {
                    verbose(promise.all, {verbose: verbosity});
                }
                throw new Error(`Command "${command}" failed`);
            }

            return promise.stdout;
        }

        return '';
    }
}


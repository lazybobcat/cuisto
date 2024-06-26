import {ExecaChildProcess, execa} from 'execa';

import {verbose} from './verbose';

export class Command {
    /**
     * Execute a command.
     * @param command The command to execute.
     * @param dryRun If true, the command will not be executed.
     * @returns The stdout of the command.
     */
    static async run(command: string, args: string[] = [], dryRun = false): Promise<string> {
        dryRun = 'true' === process.env['DRY_RUN'] || dryRun;
        const verbosity = Number(process.env['VERBOSE']) || 0;

        return this.doRun(command, args, dryRun, verbosity);
    }

    /**
     * Starts a child process with the given command to execute.
     * @param command The command to execute.
     * @param args The arguments to pass to the command.
     */
    static childProcess(command: string, args: string[] = []): ExecaChildProcess {
        return execa(command, args, {stdio: 'inherit'});
    }

    private static async doRun(command: string, args: string[], dryRun: boolean, verbosity: number): Promise<string> {
        const suffix = dryRun ? ' (dry run)' : '';
        const flatArgs = args.join(' ');
        verbose(`Running command${suffix}: ${command} ${flatArgs}`, {verbose: verbosity});

        if (!dryRun) {
            const promise = await execa(command, args);
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


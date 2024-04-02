import {Ora, oraPromise} from 'ora';
import chalk from 'chalk';

export const info = (message: string, prefix = true) => format(message, 'cyan', prefix);
export const success = (message: string, prefix = true) => format(message, 'green', prefix);
export const warning = (message: string, prefix = true) => format(message, 'yellow', prefix);
export const error = (message: string, prefix = true) => format(message, 'red', prefix);
export const printInfo = (message: string) => console.log(info(message));
export const printSuccess = (message: string) => console.log(success(message));
export const printWarning = (message: string) => console.log(warning(message));
export const printError = (message: string) => console.log(error(message));

const format = (message: string, color: 'cyan' | 'green' | 'red' | 'yellow', prefix = true) => {
    const p = prefix ? `${chalk[color](' ↪')} ${chalk.reset.inverse.bold[color](' CUISTO ')}  ` : '';

    return `${p}${chalk[color](message)}`;
};

let _output: Output | null = null;
export const output = () => {
    if (!_output) {
        _output = new Output();
    }

    return _output;
};

class Output {
    static(message: string) {
        console.log(`    ↪ ${message}`);
    }

    async animated<T = unknown>(message: string, task: Promise<T> | ((spinner: Ora) => Promise<T>), level = 2) {
        const result = await oraPromise(s => {
            if ('function' === typeof task) {
                return task(s);
            }

            return task;
        }, {
            text: message,
            indent: 2 * level,
            discardStdin: false,
        });

        return result;
    }

    errorAndExit(message: string): never {
        console.error(error(message, false));
        process.exit(1);
    }
}

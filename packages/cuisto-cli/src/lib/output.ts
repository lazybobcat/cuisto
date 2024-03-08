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

export const asyncTask = async <T>(task: Promise<T> | ((spinner: Ora) => Promise<T>), message: string) => {
    return oraPromise(task, {
        text: message,
        indent: 2,
        discardStdin: false,
    });
};

const format = (message: string, color: 'cyan' | 'green' | 'red' | 'yellow', prefix = true) => {
    const p = prefix ? `${chalk[color](' ↪')} ${chalk.reset.inverse.bold[color](' CUISTO ')}  ` : '';

    return `${p}${chalk[color](message)}`;
};

import chalk from 'chalk';
import ora from 'ora';

export const info = (message: string, icon = true) => icon ? `🍡 ${chalk.cyan(message)}` : chalk.cyan(message);
export const success = (message: string, icon = true) => icon ? `🍱 ${chalk.green(message)}` : chalk.green(message);
export const error = (message: string, icon = true) => icon ? `🍄 ${chalk.bold.red(message)}` : chalk.bold.red(message);
export const printInfo = (message: string, icon = true) => console.log(info(message, icon));
export const printSuccess = (message: string, icon = true) => console.log(success(message, icon));
export const printError = (message: string, icon = true) => console.log(error(message, icon));
export const verbose = (message: string, options: {verbose: number}) => {
    if (options['verbose'] > 0) {
        console.log(message);
    }
};

export const spinner = (text: string) => ora({
    text,
    spinner: {
        interval: 120,
        frames: ['🍔', '🍕', '🍖', '🍗', '🍙', '🍜', '🍝', '🍣', '🍲', '🍳']
    }
});

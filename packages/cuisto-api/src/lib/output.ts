import chalk from 'chalk';
import ora from 'ora';

export const info = (message: string) => format(message, 'cyan');
export const success = (message: string) => format(message, 'green');
export const error = (message: string) => format(message, 'red');
export const printInfo = (message: string) => console.log(info(message));
export const printSuccess = (message: string) => console.log(success(message));
export const printError = (message: string) => console.log(error(message));
export const verbose = (message: string, options: {verbose: number}) => {
    if (options['verbose'] > 0) {
        console.error(message);
    }
};

export const spinner = (text: string) => ora({
    text,
    spinner: {
        interval: 120,
        frames: ['🍔', '🍕', '🍖', '🍗', '🍙', '🍜', '🍝', '🍣', '🍲', '🍳']
    }
});

const format = (message: string, color: 'cyan' | 'green' | 'red') => `${chalk[color](' ↪')} ${chalk.reset.inverse.bold[color](' CUISTO ')}  ${chalk[color](message)}`;

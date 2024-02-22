import chalk from 'chalk';

export const success = chalk.green;
export const error = chalk.bold.red;
export const verbose = (message: string, options: {verbose: number}) => {
    if (options['verbose'] > 0) {
        console.log(message);
    }
};

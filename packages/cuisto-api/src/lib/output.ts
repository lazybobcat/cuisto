import chalk from 'chalk';
import ora from 'ora';

export const success = chalk.green;
export const error = chalk.bold.red;
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

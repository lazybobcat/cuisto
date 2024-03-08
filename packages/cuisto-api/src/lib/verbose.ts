export const verbose = (message: string, options: {verbose: number}) => {
    if (options['verbose'] > 0) {
        console.error(`\n${message}`);
    }
};

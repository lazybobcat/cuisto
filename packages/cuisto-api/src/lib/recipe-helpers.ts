import {printError} from './output';

export class Helper {
    /**
     * Print an error message and exit the process with code 1.
     * @param message The error message to print.
     * @example
     * if (false) {
     *    return Helper.errorAndExit('This should never happen');
     * }
     */
    static errorAndExit(message: string): never {
        printError(message);
        process.exit(1);
    }
}

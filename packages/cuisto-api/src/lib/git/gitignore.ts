import {doMerge, doParse, doStringify} from './gitignore-functions';
import {VirtualFS} from '../virtual-fs';

/**
 * .gitignore file manager
 * Use it to read and write .gitignore files.
 */
export class Gitignore {
    /**
     * @param vfs Virtual file system containing the .gitignore file(s)
     * @param filePath Path to the .gitignore file to use (by default '.gitignore' at the root of the project)
     */
    // eslint-disable-next-line no-empty-function
    constructor(private readonly vfs: VirtualFS, private readonly filePath = '.gitignore') {}

    /**
     * Read the .gitignore file and return the patterns as an array of strings
     * @returns Array of patterns
     * @example
     * const gitignore = new Gitignore(vfs);
     * const patterns = gitignore.readPatterns();
     * console.log(patterns);
     * // ['node_modules/', 'dist/', '!dist/.gitkeep']
     */
    readPatterns = (): string[] => {
        const content = this.vfs.read(this.filePath, 'utf-8');

        return doParse(content || '');
    };

    /**
     * Write the patterns to the .gitignore file
     * @param patterns Array of patterns to write to the .gitignore file
     * @example
     * const gitignore = new Gitignore(vfs);
     * gitignore.addPatterns(['node_modules/', 'dist/', '!dist/.gitkeep']);
     */
    addPatterns = (patterns: string[]): void => {
        if (0 === Object.keys(patterns).length) {
            return;
        }

        const fileContent = doParse(this.vfs.read(this.filePath, 'utf-8') || '');
        this.vfs.write(this.filePath, doStringify(doMerge(fileContent, patterns)));
    };
}

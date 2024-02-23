import {MakeDirectoryOptions, Mode, WriteFileOptions, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {dirname, join, relative, sep} from 'path';

import {changesToTree, printTree} from './print-tree';
import {spinner, verbose} from './output';
import {Changes} from './file-change';

// const {} = fs;

/**
 * A virtual file system that can be used to simulate file system operations.
 * It uses a real file system as a base and keeps track of the changes made to it.
 */
export class VirtualFS {
    #changes: Changes = {};

    constructor(readonly root: string, private verbose = 0) {
        this.root = root;
    }

    /**
     * Read the content of a file.
     * @param path Path to the file relative to the root, whether it is a real file or a virtual file.
     * @param encoding The encoding of the file. If not provided, the content will be returned as a Buffer.
     * @returns The content of the file or null if the file does not exist.
     */
    read(filePath: string): Buffer | null;
    read(filePath: string, encoding: BufferEncoding): string | null;
    read(path: string, encoding?: BufferEncoding): Buffer | string | null {
        path = this.normalize(path);
        try {
            const node = this.#changes[path];
            const content = node ? node.content : this.fsRead(path);

            if (null === content) {
                return null;
            }

            return encoding ? content.toString(encoding) : content;
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: this.verbose});

            return null;
        }
    }

    /**
     * Write content to a file.
     * @param path The path to the file.
     * @param content The content to write to the file as a string or Buffer.
     * @param mode The permissions to set for the file.
     */
    write = (path: string, content: Buffer | string, mode?: Mode): void => {
        path = this.normalize(path);
        let operation: 'CREATE' | 'UPDATE' = 'CREATE';
        let bufferedContent: Buffer;

        try {
            bufferedContent = Buffer.isBuffer(content) ? content : Buffer.from(content);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: this.verbose});

            return;
        }

        if (this.fsExists(path)) {
            operation = 'UPDATE';

            // check if content is the same as the real file
            // if so, remove the change (no need to update the file)
            if (bufferedContent.equals(this.fsRead(path))) {
                delete this.#changes[path];

                return;
            }
        }

        this.#changes[path] = {
            content: bufferedContent,
            operation,
            mode
        };
    };

    /**
     * Delete a file or a directory.
     * @param path The path to the file to delete.
     */
    delete = (path: string): void => {
        path = this.normalize(path);
        const deleteNodeFromPath = (p: string) => {
            const node = this.#changes[p];
            if (node && 'CREATE' === node.operation) {
                delete this.#changes[p];
            }
            if (node && 'UPDATE' === node.operation) {
                node.operation = 'DELETE';
            }
        };
        for (const p of this.pathsInDirectory(path)) {
            deleteNodeFromPath(p);
        }

        const node = this.#changes[path];
        if (node && 'CREATE' === node.operation) {
            delete this.#changes[path];
        } else if (node || this.fsExists(path)) {
            this.#changes[path] = {
                content: null,
                operation: 'DELETE'
            };
        }

        // Remove empty directories
        if ('' !== path && 0 === this.children(dirname(path)).length) {
            this.delete(dirname(path));
        }
    };

    /**
     * Rename or move a file or a directory.
     * @param fromPath The path to the file or directory to rename.
     * @param toPath The new path of the file or directory.
     */
    rename = (fromPath: string, toPath: string): void => {
        fromPath = this.normalize(fromPath);
        toPath = this.normalize(toPath);
        if (fromPath === toPath) {
            return;
        }

        if (this.isFile(fromPath)) {
            const content = this.read(fromPath);
            this.write(toPath, content ?? '');
            this.delete(fromPath);
        } else {
            for (const child of this.children(fromPath)) {
                this.rename(join(fromPath, child), join(toPath, child));
            }
        }
    };

    /**
     * Check if a file or directory exists and has not been deleted, either in the virtual file system or in the real file system.
     * @param path The path to the file or directory to check.
     */
    exists = (path: string): boolean => {
        path = this.normalize(path);
        try {
            const node = this.#changes[path];
            if (node) {
                return 'DELETE' !== node.operation;
            }

            if (this.pathsInDirectory(path).length > 0) {
                return true;
            }

            return this.fsExists(path);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: this.verbose});

            return false;
        }
    };

    /**
     * Check if a path is a file and has not been deleted, either in the virtual file system or in the real file system.
     * @param path The path to the file to check.
     * @returns True if the path is a file and has not been deleted, false otherwise.
     */
    isFile = (path: string): boolean => {
        path = this.normalize(path);
        try {
            const node = this.#changes[path];
            if (node) {
                return 'DELETE' !== node.operation;
            }

            return this.fsIsFile(path);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: this.verbose});

            return false;
        }
    };

    /**
     * Get the list of files and directories in a directory that have not been deleted, either in the virtual file system or in the real file system.
     * @param path The path to the directory to check.
     * @returns The list of paths to the files and directories in the directory.
     */
    children = (path: string): string[] => {
        path = this.normalize(path);
        try {
            let list = this.fsReadDir(path);
            list = [...list, ...this.pathsInDirectory(path).map(p => p.substring(path.length + 1))];
            list = list.filter(p => 'DELETE' !== this.#changes[join(path, p)]?.operation);

            // Avoid duplicates
            return Array.from(new Set(list));
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: this.verbose});

            return [];
        }
    };

    /**
     * Get the changes made to the virtual file system.
     * 
     * @returns A snapshot of the changes made to the virtual file system.
     */
    changes = (): Changes => {
        return {...this.#changes};
    };

    /**
     * @returns A string representation of the virtual file system.
     */
    tree = (): string => printTree(changesToTree(this.#changes), this.root);

    private fsExists = (path: string): boolean => existsSync(join(this.root, path));
    private fsRead = (path: string): Buffer => readFileSync(join(this.root, path));
    private fsReadDir = (path: string): string[] => {
        // If the directory does not exist, return an empty array
        try {
            return readdirSync(join(this.root, path));
        } catch {
            return [];
        }
    };
    private fsIsFile = (path: string): boolean => statSync(join(this.root, path)).isFile();

    private normalize = (path: string): string => relative(this.root, join(this.root, path)).split(sep).join('/');
    private pathsInDirectory = (path: string): string[] => {
        return Object.keys(this.#changes).filter(p => p.startsWith(`${path}/`));
    };
}

const outputFileSync = (path: string, content: Buffer | string, options: {mode?: Mode} = {}): void => {
    const mkdirOptions: MakeDirectoryOptions = {recursive: true};
    const writeOptions: WriteFileOptions = {};
    if (options.mode) {
        mkdirOptions.mode = options.mode;
        writeOptions.mode = options.mode;
    }
    mkdirSync(dirname(path), mkdirOptions);
    writeFileSync(path, content, writeOptions);
};

/**
 * @internal
 */
export const applyChanges = async (vfs: VirtualFS, verboseLevel = 1): Promise<void> => {
    for (const [path, change] of Object.entries(vfs.changes())) {
        const progress = spinner(`Applying changes to ${path}...`).start();

        try {
            const fullPath = join(vfs.root, path);

            if ('CREATE' === change.operation) {
                progress.text = `Creating ${path}...`;
                outputFileSync(fullPath, change.content || '', {mode: change.mode});
            }

            if ('UPDATE' === change.operation) {
                progress.text = `Updating ${path}...`;
                outputFileSync(fullPath, change.content || '', {mode: change.mode});
            }

            if ('DELETE' === change.operation) {
                progress.text = `Deleting ${path}...`;
                rmSync(fullPath, {recursive: true, force: true});
            }

            progress.succeed(`${progress.text} Done!`);
        } catch (e) {
            verbose(e instanceof Error ? e.message : String(e), {verbose: verboseLevel});
            progress.fail(`An error occurred while applying the changes to ${path}`);
        }
    }
};


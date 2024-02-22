import chalk from 'chalk';

import {Changes, FileChange, changeIsDirectory, changeIsFile} from './file-change';

type ChangeTree = {
    [path: string]: Changes | FileChange
};

export const changesToTree = (changes: Changes): ChangeTree => {
    const tree: ChangeTree = {};

    // Split changes path and generate a tree
    for (const path of Object.keys(changes)) {
        const parts = path.split('/');
        let current = tree;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i] as string;
            if (i === parts.length - 1) {
                current[part] = changes[path] as FileChange | Changes;
            } else {
                current[part] = current[part] || {};
                current = current[part] as Changes;
            }
        }
    }

    return tree;
};

/**
 * Sort the changes by type (directory first, then file name).
 */
export const sortChanges = (changes: ChangeTree): ChangeTree => {
    const sorted: ChangeTree = {};

    for (const path of Object.keys(changes).sort((a, b) => {
        const changeA = changes[a] as FileChange | Changes;
        const changeB = changes[b] as FileChange | Changes;

        if (changeIsDirectory(changeA) && changeIsFile(changeB)) {
            return -1;
        }

        if (changeIsFile(changeA) && changeIsDirectory(changeB)) {
            return 1;
        }

        return a.localeCompare(b);
    })) {
        sorted[path] = changes[path] as FileChange | Changes;
    }

    return sorted;
};

/**
 * Print the changes made to the virtual file system as a tree.
 */
export const printTree = (nodes: ChangeTree, root: string, depth = 0, arrLastElements: boolean[] = []): string => {
    // sort nodes
    const sortedNodes: ChangeTree = sortChanges(nodes);
    let str = '';

    // Print root
    if (0 === depth) {
        str += chalk.bold(root);
    }

    // Print children
    let i = 0;
    for (const path in sortedNodes) {
        i++;
        const node = sortedNodes[path];
        if (undefined === node) {
            continue;
        }

        const lastElement = i >= Object.keys(sortedNodes).length;
        const prefix = lastElement ? '└─' : '├─';

        const tab = arrLastElements.map(last => last ? '   ' : '│  ').join('');

        if (changeIsFile(node)) {
            // File
            let operation = '';
            switch (node.operation) {
                case 'CREATE':
                    operation = chalk.bgGreen('CREATE');
                    break;
                case 'UPDATE':
                    operation = chalk.bgYellow('UPDATE');
                    break;
                case 'DELETE':
                    operation = chalk.bgRed('DELETE');
                    break;
            }
            str += `\n${tab}${prefix} ${operation} ${path}`;
        }
        if (changeIsDirectory(node)) {
            // Directory
            str += `\n${tab}${prefix} ${path}${printTree(node, root, depth + 1, [...arrLastElements, lastElement])}`;
        }
    }

    return str;
};

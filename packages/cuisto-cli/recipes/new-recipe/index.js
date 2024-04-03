import {FileGenerator} from '@lazybobcat/cuisto-api';

/**
 * This recipe creates the base code and configuration files for a new recipe.
 */
export default async function({ vfs, properties, recipePath }) {
    // add eslintrc file
    vfs.write('.eslintrc', JSON.stringify({
        'root': true,
        'env': {
            'node': true
        },
        'extends': [
            'eslint:recommended'
        ],
        'parserOptions': {
            'sourceType': 'module',
            'ecmaVersion': 'latest'
        }
    }, undefined, 4));

    const fg = new FileGenerator(vfs);
    fg.generateFiles(`${recipePath}/files`, vfs.root, properties);
}

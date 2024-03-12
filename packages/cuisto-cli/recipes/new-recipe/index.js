import {FileGenerator} from '@lazybobcat/cuisto-api';

/**
 * This recipe creates the base code and configuration files for a new recipe.
 */
export default async function({ vfs, properties, recipePath }) {
    const fg = new FileGenerator(vfs);
    fg.generateFiles(`${recipePath}/files`, vfs.root, properties);
}

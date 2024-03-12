import {FileGenerator} from '@lazybobcat/cuisto-api';

/**
 * This recipe initializes a a new cuisto configuration file.
 */
export default async function({ vfs, properties, recipePath }) {
    const fg = new FileGenerator(vfs);
    fg.generateFiles(`${recipePath}/files`, vfs.root, properties);
}

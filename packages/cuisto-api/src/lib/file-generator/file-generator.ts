import {readFileSync} from 'node:fs';

import {generateFileContent, generateFilePath, getAllDescendantFiles} from './file-generator-functions';
import {Variables} from './file-generator-types';
import {VirtualFS} from '../virtual-fs';

export class FileGenerator {
    // eslint-disable-next-line no-empty-function
    constructor(private readonly vfs: VirtualFS) {}

    generateFiles = (sourceDirectory: string, targetDirectory: string, variables: Variables): void => {
        const files = getAllDescendantFiles(sourceDirectory);
        console.log(`Generating files from ${sourceDirectory} to ${targetDirectory}`, files);
        for (const file of files) {
            // we need to use EJS on the file contents to replace the variables (if the file is not a binary file)
            // we also need to replace the file name with the variables (such as __variable__ => value)
            if (targetDirectory.startsWith(this.vfs.root)) {
                targetDirectory = targetDirectory.replace(this.vfs.root, '');
            }
            const targetPath = generateFilePath(sourceDirectory, targetDirectory, file, variables);
            const fileContent = readFileSync(file);
            console.log(`Reading file ${file}`, fileContent);

            if (null === fileContent) {
                continue;
            }

            const targetContent = generateFileContent(fileContent, variables);
            console.log(`Writing file ${targetPath}`);

            this.vfs.write(targetPath, targetContent);
        }
    };
}


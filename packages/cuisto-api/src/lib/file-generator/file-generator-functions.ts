import {readdirSync, statSync} from 'node:fs';
import ejs from 'ejs';
import {isBinaryFileSync} from 'isbinaryfile';
import path from 'node:path';

import {Variables} from './file-generator-types';

export const getAllDescendantFiles = (directory: string): string[] => {
    let files: string[] = [];
    const nodes = readdirSync(directory);
    for (const node of nodes) {
        const filePath = path.join(directory, node);
        const stat = statSync(filePath);
        if (stat.isDirectory()) {
            files = [...files, ...getAllDescendantFiles(filePath)];
        } else {
            files.push(filePath);
        }
    }

    return files;
};

export const generateFilePath = (
    sourceDirectory: string,
    targetDirectory: string,
    filePath: string,
    variables: Variables
): string => {
    const relativePath = path.relative(sourceDirectory, filePath);
    let targetPath = path.join(targetDirectory, relativePath);
    for (const [variable, value] of Object.entries(variables)) {
        targetPath = targetPath.replace(`__${variable}__`, value as string);
    }

    return targetPath;
};

export const generateFileContent = (fileContent: string | Buffer, variables: Variables): string | Buffer => {
    let targetContent: Buffer | string;

    if (isBinaryFileSync(fileContent))  {
        targetContent = fileContent;
    } else {
        if (fileContent instanceof Buffer) {
            targetContent = fileContent.toString('utf-8');
        }
        targetContent = ejs.render(
            fileContent instanceof Buffer ? fileContent.toString('utf-8') : fileContent,
            variables
        );
    }

    return targetContent;
};


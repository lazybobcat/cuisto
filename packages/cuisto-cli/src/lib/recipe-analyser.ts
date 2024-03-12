import {lstatSync, readFileSync} from 'fs';
import {join} from 'path';
import {readdirSync} from 'node:fs';
import {verbose} from '@lazybobcat/cuisto-api';

export const doesRecipeContainDangerousCode = (recipePath: string, options: {verbose: number}): boolean => {
    const dangerousCommands = [
        'sudo ',
        'exec ',
        'rm ',
        'rmdir ',
        'unlink ',
        'mv ',
        'cp ',
        'chmod ',
        'chown ',
        'chgrp ',
        'dd ',
        'mkfs ',
        'mke2fs ',
        'mkfs.ext2 ',
        'mkfs.ext3 ',
        'mkfs.ext4 ',
    ];
    const dangerousImportRxp = /(import|require)(.*)(node:|fs|child_process)/;
    const ignoreDirectories = ['node_modules', '.git', '.vscode', '.idea', '.github', '.gitlab-ci'];

    // iterates on files in the recipe:
    for (const path of readdirSync(recipePath)) {
        const filePath = join(recipePath, path);
        const file = lstatSync(filePath);
        if (file.isDirectory()) {
            // Check if we should ignore the directory
            if (ignoreDirectories.includes(path)) {
                continue;
            }
            if (doesRecipeContainDangerousCode(filePath, options)) {
                return true;
            }
        } else {
            const content = readFileSync(filePath, 'utf8');
            // Ignore config files files
            if (/^(.+).(json|yaml|yml|toml|xml|html|md|mx)$/.test(filePath)) {
                continue;
            }

            for (const dangerousCommand of dangerousCommands) {
                if (content.includes(dangerousCommand)) {
                    verbose(`Recipe file ${filePath} contains dangerous command "${dangerousCommand}"`, options);

                    return true;
                }
            }
            if (dangerousImportRxp.test(content)) {
                verbose(`Recipe file ${filePath} contains dangerous import`, options);

                return true;
            }
        }
    }

    return false;
};

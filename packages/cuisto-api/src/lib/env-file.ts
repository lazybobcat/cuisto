import {VirtualFS} from './virtual-fs';

export const parseEnvFile = (tree: VirtualFS): Record<string, string> => {
    const envFilePath = findEnvFile(tree);
    const content = tree.read(envFilePath, 'utf-8');

    return doParse(content || '');
};

export const addToEnvFile = (tree: VirtualFS, data: Record<string, string>): void => {
    if (0 === Object.keys(data).length) {
        return;
    }

    const domain = process.env['RECIPE_NAME'] || '';
    const envFilePath = findEnvFile(tree);
    let content = tree.read(envFilePath, 'utf-8') || '';

    content += `\n\n###> ${domain} ###\n`;
    for (const [key, value] of Object.entries(data)) {
        console.log(`Adding ${key}=${value}`);
        const v = String(value).includes('\n') ? `"""\n${value}\n"""` : value;
        content += `${key}=${v}\n`;
    }
    content += `###< ${domain} ###\n`;

    tree.write(envFilePath, content);
};

const findEnvFile = (tree: VirtualFS): string => {
    if (tree.exists('.env.local')) {
        return '.env.local';
    }

    if (tree.exists('.env')) {
        return '.env';
    }

    if (tree.exists('.env.dist')) {
        const content = tree.read('.env.dist');
        if (content) {
            tree.write('.env', content);

            return '.env';
        }
    }

    throw new Error('No .env file found in the project.');
};

export const doParse = (content: string): Record<string, string> => {
    return content
        // We need to preserve line breaks in quoted strings
        // First, check if there are multi-line values
        .replace(/"""(.+)"""/gs, (_, match) => match.trim().replace(/\n/g, '---KEEP---'))
        .replace(/("[\s\S]*?")/g, (_, match) => match.replace(/\n/g, '---KEEP---'))
        // then split line by line and remove empty lines
        .split('\n')
        .filter(line => line.trim() !== '')
        // then restore line breaks in quoted strings
        .map(line => line.replace(/---KEEP---/g, '\n'))
        // then parse the key-value pairs
        .map(line => line.match(/^([^=:#]+?)[=:]((.|\n)*)/) ?? null)
        // finally, build the Record
        .reduce((acc, line) => {
            if (line && line[1] && line[2]) {
                acc[line[1].trim()] = line[2].trim().replace(/['"](.+)['"]+/gs, (_, match) => match);
            }

            return acc;
        }, {} as Record<string, string>);
};

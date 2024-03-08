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

export const doStringify = (configurations: Record<string, string>): string => {
    let content = '';

    for (const [key, value] of Object.entries(configurations)) {
        content += `${key}=${JSON.stringify(value)}\n`;
    }

    return content;
};

export const doMerge = (base: Record<string, string>, toMerge: Record<string, string>): Record<string, string> => {
    return {
        ...base,
        ...toMerge,
    };
};

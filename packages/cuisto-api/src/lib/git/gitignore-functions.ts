export const doParse = (content: string): string[] => {
    return content
        // Split line by line and remove empty lines and comments
        .split('\n')
        .filter(line => line.trim() !== '')
        .filter(line => false === line.startsWith('#'));
};

export const doStringify = (patterns: string[]): string => {
    let content = '';

    for (const pattern of patterns) {
        content += `${pattern}\n`;
    }

    return content;
};

export const doMerge = (base: string[], toMerge: string[]): string[] => {
    // new Set to avoid duplicates
    return [...new Set([...base, ...toMerge])];
};

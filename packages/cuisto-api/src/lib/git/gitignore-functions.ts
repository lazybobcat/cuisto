export const doParse = (content: string): string[] => {
    return content
        // Split line by line and remove empty lines and comments
        .split('\n')
        .filter(line => line.trim() !== '')
        .filter(line => false === line.startsWith('#'));
};

export const doStringify = (patterns: string[], domain: string): string => {
    let content = '';

    content += `\n\n###> ${domain} ###\n`;
    for (const pattern of patterns) {
        content += `${pattern}\n`;
    }
    content += `###< ${domain} ###\n`;

    return content;
};

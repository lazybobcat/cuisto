import {doMerge, doParse, doStringify} from './gitignore-functions';

describe('doParse', () => {
    test('should parse a .gitignore file', () => {
        const content = `
node_modules/
        `;
        const result = doParse(content);
        expect(result).toEqual(['node_modules/']);
    });

    test('should parse a .gitignore file with comments', () => {
        const content = `
# Ignore node_modules
node_modules/
        `;
        const result = doParse(content);
        expect(result).toEqual(['node_modules/']);
    });

    test('should parse a .gitignore file with comments and empty lines', () => {
        const content = `
# Ignore node_modules
node_modules/

# Ignore dist
dist/
        `;
        const result = doParse(content);
        expect(result).toEqual(['node_modules/', 'dist/']);
    });

    test('should parse a .gitignore file with negation !name', () => {
        const content = `
dist/
!dist/.gitkeep
        `;
        const result = doParse(content);
        expect(result).toEqual(['dist/', '!dist/.gitkeep']);
    });
});

describe('doStringify', () => {
    test('should stringify a .gitignore file', () => {
        const files = ['node_modules/'];
        const domain = 'my-app';
        const result = doStringify(files, domain);
        expect(result).toEqual('node_modules/\n');
    });

    test('should stringify a .gitignore file with several elements', () => {
        const files = ['node_modules/', 'dist/', '!dist/.gitkeep'];
        const domain = 'my-app';
        const result = doStringify(files, domain);
        expect(result).toEqual('node_modules/\ndist/\n!dist/.gitkeep\n');
    });
});

describe('doMerge', () => {
    test('should merge two .gitignore files', () => {
        const base = ['node_modules/'];
        const toMerge = ['dist/', '!dist/.gitkeep'];
        const result = doMerge(base, toMerge);
        expect(result).toEqual(['node_modules/', 'dist/', '!dist/.gitkeep']);
    });

    test('should merge two .gitignore files with duplicates', () => {
        const base = ['node_modules/', 'dist/'];
        const toMerge = ['dist/', '!dist/.gitkeep'];
        const result = doMerge(base, toMerge);
        expect(result).toEqual(['node_modules/', 'dist/', '!dist/.gitkeep']);
    });
});

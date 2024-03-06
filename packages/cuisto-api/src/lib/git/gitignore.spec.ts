import {doParse, doStringify} from './gitignore_functions';

describe('.gitignore doParse', () => {
    it('should parse a .gitignore file', () => {
        const content = `
node_modules/
        `;
        const result = doParse(content);
        expect(result).toEqual(['node_modules/']);
    });

    it('should parse a .gitignore file with comments', () => {
        const content = `
# Ignore node_modules
node_modules/
        `;
        const result = doParse(content);
        expect(result).toEqual(['node_modules/']);
    });

    it('should parse a .gitignore file with comments and empty lines', () => {
        const content = `
# Ignore node_modules
node_modules/

# Ignore dist
dist/
        `;
        const result = doParse(content);
        expect(result).toEqual(['node_modules/', 'dist/']);
    });

    it('should parse a .gitignore file with negation !name', () => {
        const content = `
dist/
!dist/.gitkeep
        `;
        const result = doParse(content);
        expect(result).toEqual(['dist/', '!dist/.gitkeep']);
    });
});

describe('.gitignore doStringify', () => {
    it('should stringify a .gitignore file', () => {
        const files = ['node_modules/'];
        const domain = 'my-app';
        const result = doStringify(files, domain);
        expect(result).toEqual('\n\n###> my-app ###\nnode_modules/\n###< my-app ###\n');
    });

    it('should stringify a .gitignore file with several elements', () => {
        const files = ['node_modules/', 'dist/', '!dist/.gitkeep'];
        const domain = 'my-app';
        const result = doStringify(files, domain);
        expect(result).toEqual('\n\n###> my-app ###\nnode_modules/\ndist/\n!dist/.gitkeep\n###< my-app ###\n');
    });
});

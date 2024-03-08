import {doMerge, doParse, doStringify} from './dotenv-functions';

describe('doParse', () => {
    test('should parse a simple env file', () => {
        const content = `
            FOO=bar
            BAZ = qux
        `;

        const result = doParse(content);
        expect(result).toEqual({
            FOO: 'bar',
            BAZ: 'qux',
        });
    });

    test('should parse a simple env file with comments', () => {
        const content = `
            # This is a comment
            FOO=bar
            # Another comment
            BAZ=qux
        `;

        const result = doParse(content);
        expect(result).toEqual({
            FOO: 'bar',
            BAZ: 'qux',
        });
    });

    test('should parse a simple env file with quotes', () => {
        const content = `
            FOO = "bar"
            BAZ='qux'
        `;

        const result = doParse(content);
        expect(result).toEqual({
            FOO: 'bar',
            BAZ: 'qux',
        });
    });

    test('should parse a simple env file with multi-line values', () => {
        const content = `
FOO="""
bar
"""
BAZ="qux
quux"
        `;

        const result = doParse(content);
        expect(result).toEqual({
            FOO: 'bar',
            BAZ: 'qux\nquux',
        });
    });
});

describe('doStringify', () => {
    test('should stringify a simple env file', () => {
        const configurations = {
            FOO: 'bar',
            BAZ: 'qux',
        };

        const result = doStringify(configurations);
        expect(result).toEqual('FOO="bar"\nBAZ="qux"\n');
    });

    test('should stringify a simple env file with multi-line values', () => {
        const configurations = {
            FOO: 'bar',
            BAZ: 'qux\nquux',
        };

        const result = doStringify(configurations);
        expect(result).toEqual('FOO="bar"\nBAZ="qux\\nquux"\n');
    });

    test('should stringify a simple env file with quotes', () => {
        const configurations = {
            FOO: '"bar"',
            BAZ: "'qux'",
        };

        const result = doStringify(configurations);
        expect(result).toEqual('FOO="\\"bar\\""\nBAZ="\'qux\'"\n');
    });
});

describe('doMerge', () => {
    test('should merge two env files', () => {
        const base = {
            FOO: 'bar',
        };
        const toMerge = {
            BAZ: 'qux',
        };

        const result = doMerge(base, toMerge);
        expect(result).toEqual({
            FOO: 'bar',
            BAZ: 'qux',
        });
    });

    test('should merge two env files with multi-line values', () => {
        const base = {
            FOO: 'bar',
        };
        const toMerge = {
            BAZ: 'qux\nquux',
        };

        const result = doMerge(base, toMerge);
        expect(result).toEqual({
            FOO: 'bar',
            BAZ: 'qux\nquux',
        });
    });

    test('should merge two env files with quotes', () => {
        const base = {
            FOO: '"bar"',
        };
        const toMerge = {
            BAZ: "'qux'",
        };

        const result = doMerge(base, toMerge);
        expect(result).toEqual({
            FOO: '"bar"',
            BAZ: "'qux'",
        });
    });

    test('should merge two env files with the same key by overriding', () => {
        const base = {
            FOO: 'bar',
        };
        const toMerge = {
            FOO: 'qux',
        };

        const result = doMerge(base, toMerge);
        expect(result).toEqual({
            FOO: 'qux',
        });
    });
});

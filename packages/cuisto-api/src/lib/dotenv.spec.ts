import {doParse, doStringify} from './dotenv';

describe('DotEnv.readEnvironmentVariables', () => {
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

describe('DotEnv.addEnvironmentVariables', () => {
    test('should stringify a simple env file', () => {
        const configurations = {
            FOO: 'bar',
            BAZ: 'qux',
        };

        const result = doStringify(configurations, 'domain');
        expect(result).toEqual('\n\n###> domain ###\nFOO="bar"\nBAZ="qux"\n###< domain ###\n');
    });

    test('should stringify a simple env file with multi-line values', () => {
        const configurations = {
            FOO: 'bar',
            BAZ: 'qux\nquux',
        };

        const result = doStringify(configurations, 'domain');
        expect(result).toEqual('\n\n###> domain ###\nFOO="bar"\nBAZ="qux\\nquux"\n###< domain ###\n');
    });

    test('should stringify a simple env file with quotes', () => {
        const configurations = {
            FOO: '"bar"',
            BAZ: "'qux'",
        };

        const result = doStringify(configurations, 'domain');
        expect(result).toEqual('\n\n###> domain ###\nFOO="\\"bar\\""\nBAZ="\'qux\'"\n###< domain ###\n');
    });
});

import {doParse} from './env-file';

describe('env-file', () => {
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

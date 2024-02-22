import {changesToTree, printTree, sortChanges} from './print-tree';
import {Changes} from './file-change';

const mockChanges = (): Changes => ({
    'dist/hello.txt': {
        content: Buffer.from('Hello World!'),
        mode: 0o666,
        operation: 'CREATE',
    },
    'version.txt': {
        content: Buffer.from('42'),
        operation: 'CREATE',
    },
    'docker/images/Dockerfile': {
        content: Buffer.from('FROM node:20'),
        operation: 'UPDATE',
    },
});

describe('changesToTree', () => {
    test('should return a tree of changes', () => {
        const changes = mockChanges();

        const result = changesToTree(changes);
        expect(result).toEqual({
            dist: {
                'hello.txt': {
                    content: Buffer.from('Hello World!'),
                    mode: 0o666,
                    operation: 'CREATE',
                },
            },
            docker: {
                images: {
                    'Dockerfile': {
                        content: Buffer.from('FROM node:20'),
                        operation: 'UPDATE',
                    },
                },
            },
            'version.txt': {
                content: Buffer.from('42'),
                operation: 'CREATE',
            },
        });
    });
});

describe('sortChanges', () => {
    test('should sort the changes', () => {
        const changes = mockChanges();
        changes['aaadir/somefile'] = {
            content: Buffer.from('aaa'),
            operation: 'CREATE',
        };
        changes['aaafile'] = {
            content: Buffer.from('aaa'),
            operation: 'CREATE',
        };

        const result = sortChanges(changesToTree(changes));
        expect(Object.keys(result)).toEqual(['aaadir', 'dist', 'docker', 'aaafile', 'version.txt']);
        expect(result).toEqual({
            aaadir: {
                somefile: {
                    content: Buffer.from('aaa'),
                    operation: 'CREATE',
                },
            },
            dist: {
                'hello.txt': {
                    content: Buffer.from('Hello World!'),
                    mode: 0o666,
                    operation: 'CREATE',
                },
            },
            docker: {
                images: {
                    'Dockerfile': {
                        content: Buffer.from('FROM node:20'),
                        operation: 'UPDATE',
                    },
                },
            },
            aaafile: {
                content: Buffer.from('aaa'),
                operation: 'CREATE',
            },
            'version.txt': {
                content: Buffer.from('42'),
                operation: 'CREATE',
            },
        });
    });
});

describe('printTree', () => {
    test('should print the tree of changes', () => {
        const changes = mockChanges();
        changes['docker/conf/config.json'] = {
            content: Buffer.from('{"key": "value"}'),
            operation: 'CREATE',
        };
        changes['docker/conf/nginx.conf'] = {
            content: Buffer.from('server { listen 80; }'),
            operation: 'CREATE',
        };
        delete changes['version.txt'];
        changes['version.txt/trap'] = {
            content: Buffer.from('42'),
            operation: 'CREATE',
        };

        const result = printTree(changesToTree(changes), 'root');
        expect(result).toEqual('[1mroot[22m\n├─ dist\n│  └─ [42mCREATE[49m hello.txt\n├─ docker\n│  ├─ conf\n│  │  ├─ [42mCREATE[49m config.json\n│  │  └─ [42mCREATE[49m nginx.conf\n│  └─ images\n│     └─ [43mUPDATE[49m Dockerfile\n└─ version.txt\n   └─ [42mCREATE[49m trap');
    });
});

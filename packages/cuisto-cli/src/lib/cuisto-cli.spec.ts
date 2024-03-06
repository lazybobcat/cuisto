import {VirtualFS} from '@lazybobcat/cuisto-api';
import {vol} from 'memfs';

import {applyChanges} from './cuisto-cli';

describe('cuisto-cli', () => {
    let vfs: VirtualFS;

    beforeEach(() => {
        vi.mock('node:fs', async () => await vi.importActual<typeof import('memfs')>('memfs'));
        vol.fromJSON({
            '/tmp/dist/hello.txt': 'Hello World!',
            '/tmp/foo': 'bar',
            '/tmp/baz': 'qux',
        }, '/');
        vfs = new VirtualFS('/tmp');
    });

    test('applyChanges() should apply the changes to the file system', async () => {
        vfs.rename('dist', 'dist2');
        vfs.write('foo', 'lorem ipsum', 0o777); // mode is only set at creation
        vfs.write('password', 'password', 0o777);
        vfs.rename('baz', 'bar');

        applyChanges(vfs);

        expect(() => vol.readFileSync('/tmp/dist/hello.txt', 'utf-8')).toThrowError();
        expect(vol.readFileSync('/tmp/dist2/hello.txt', 'utf-8')).toEqual('Hello World!');
        expect(vol.readFileSync('/tmp/foo', 'utf-8')).toEqual('lorem ipsum');
        expect(fileModeToString(vol.statSync('/tmp/foo').mode)).toEqual('0666');
        expect(fileModeToString(vol.statSync('/tmp/password').mode)).toEqual('0777');
        expect(() => vol.readFileSync('baz', 'utf-8')).toThrowError();
        expect(vol.readFileSync('/tmp/bar', 'utf-8')).toEqual('qux');
        expect(vfs.children('/')).toEqual(['bar', 'dist2', 'foo', 'password']);
    });
});

const fileModeToString = (mode: number): string => '0' + (mode & parseInt('777', 8)).toString(8);

import {vol} from 'memfs';

import {VirtualFS} from './virtual-fs';

describe('VirtualFS', () => {
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

    test('children()', () => {
        let result = vfs.children('/');
        expect(result).toEqual(['baz', 'dist', 'foo']);

        result = vfs.children('dist');
        expect(result).toEqual(['hello.txt']);

        // Check if path is normalized
        result = vfs.children('/dist/');
        expect(result).toEqual(['hello.txt']);
        result = vfs.children('////');
        expect(result).toEqual(['baz', 'dist', 'foo']);
    });

    test('read()', () => {
        const bufferResult = vfs.read('dist/hello.txt');
        expect(bufferResult?.toLocaleString()).toEqual('Hello World!');
        let textResult = vfs.read('dist/hello.txt', 'utf-8');
        expect(textResult).toEqual('Hello World!');

        textResult = vfs.read('foo', 'utf-8');
        expect(textResult).toEqual('bar');

        textResult = vfs.read('baz', 'utf-8');
        expect(textResult).toEqual('qux');

        textResult = vfs.read('this-file-does-not-exist', 'utf-8');
        expect(textResult).toBeNull();

        // Check if path is normalized
        textResult = vfs.read('/foo////', 'utf-8');
        expect(textResult).toEqual('bar');
        textResult = vfs.read('////baz', 'utf-8');
        expect(textResult).toEqual('qux');
    });

    test('write()', () => {
        // write does not actually write to the file system
        vfs.write('dist/hello.txt', 'Bonjour le monde !');
        expect(vol.readFileSync('/tmp/dist/hello.txt', 'utf-8')).toEqual('Hello World!');
        // we can access the content of the virtual file
        expect(vfs.read('dist/hello.txt', 'utf-8')).toEqual('Bonjour le monde !');

        // write creates the file in the virtual file system
        vfs.write('i18n/en/hello.txt', 'Hello World!');
        expect(vfs.read('i18n/en/hello.txt', 'utf-8')).toEqual('Hello World!');
        expect(vfs.changes()['i18n/en/hello.txt']?.operation).toEqual('CREATE');
        expect(() => vol.statSync('/tmp/i18n/en/hello.txt')).toThrowError();

        // writing to a file that does exist mark the operation as an update
        vfs.write('foo', 'FOO');
        expect(vfs.read('foo', 'utf-8')).toEqual('FOO');
        expect(vfs.changes()['foo']?.operation).toEqual('UPDATE');

        // writing the original content to a changed file should remove the change
        vfs.write('foo', 'bar');
        expect(vfs.read('foo', 'utf-8')).toEqual('bar');
        expect(vfs.changes()['foo']).toBeUndefined();

        // Check if path is normalized
        vfs.write('//////dist//slash.txt///', 'so many slashes');
        expect(vfs.read('dist/slash.txt', 'utf-8')).toEqual('so many slashes');
    });

    test('delete()', () => {
        // mark existing file as deleted
        vfs.write('foo', 'FOO');
        vfs.delete('foo');
        expect(vfs.changes()['foo']?.operation).toEqual('DELETE');
        expect(vol.readFileSync('/tmp/foo', 'utf-8')).toEqual('bar'); // real file still exists

        // created file that is deleted should not be in the changes
        vfs.write('bar', 'BAR');
        vfs.delete('bar');
        expect(vfs.changes()['bar']).toBeUndefined();

        // non-existing file should not be in the changes
        vfs.delete('this-file-does-not-exist');
        expect(vfs.changes()['this-file-does-not-exist']).toBeUndefined();

        // deleting a directory should mark all files in the directory as deleted
        vfs.write('dist/hello.txt', 'I will be deleted');
        vfs.delete('dist');
        expect(vfs.changes()['dist/hello.txt']?.operation).toEqual('DELETE');

        // Check if path is normalized
        vfs.write('dist/hello.txt', 'I will be deleted');
        vfs.delete('////dist//hello.txt////');
        expect(vfs.changes()['dist/hello.txt']?.operation).toEqual('DELETE');

        // Check that we cannot delete the project root '.'
        vfs.delete('foo');
        vfs.delete('baz');
        vfs.delete('dist');
        expect(Object.keys(vfs.changes())).toEqual(['foo', 'dist/hello.txt', 'dist', 'baz']);
    });

    test('delete() should remove empty directories', () => {
        // deleting a directory should mark all files in the directory as deleted
        vfs.delete('dist/hello.txt');
        expect(vfs.changes()['dist/hello.txt']?.operation).toEqual('DELETE');
        expect(vfs.changes()['dist']?.operation).toEqual('DELETE');
    });

    test('rename()', () => {
        // rename a file
        vfs.write('dist/hello.txt', 'I will be renamed');
        vfs.rename('dist/hello.txt', 'dist/bonjour.txt');
        expect(vfs.changes()['dist/hello.txt']?.operation).toEqual('DELETE');
        expect(vfs.changes()['dist/bonjour.txt']?.operation).toEqual('CREATE');
        expect(vol.readFileSync('/tmp/dist/hello.txt', 'utf-8')).toEqual('Hello World!');
        expect(() => vol.readFileSync('/tmp/dist/bonjour.txt', 'utf-8')).toThrowError();

        // rename a directory
        vfs.write('corn/crontab.txt', '0 0 * * *');
        vfs.rename('corn', 'cron');
        expect(vfs.changes()['corn/crontab.txt']).toBeUndefined();
        expect(vfs.changes()['cron/crontab.txt']?.operation).toEqual('CREATE');

        // rename a file to the same path
        vfs.rename('foo', 'foo');
        expect(vfs.changes()['foo']).toBeUndefined();

        // Check if path is normalized
        vfs.rename('////foo////', 'f00');
        expect(vfs.changes()['foo']?.operation).toEqual('DELETE');
        expect(vfs.changes()['f00']?.operation).toEqual('CREATE');
    });

    test('exists()', () => {
        expect(vfs.exists('dist/hello.txt')).toBeTruthy();
        expect(vfs.exists('dist')).toBeTruthy();
        expect(vfs.exists('foo')).toBeTruthy();
        expect(vfs.exists('this-file-does-not-exist')).toBeFalsy();

        // Deleted files should not exist
        vfs.delete('foo');
        expect(vfs.exists('foo')).toBeFalsy();

        // Virtual files should exist
        vfs.write('virtual-file', 'I exist');
        expect(vfs.exists('virtual-file')).toBeTruthy();

        // Check if path is normalized
        expect(vfs.exists('////dist//hello.txt////')).toBeTruthy();
        expect(vfs.exists('////dist////')).toBeTruthy();
        expect(vfs.exists('////this-file-does-not-exist////')).toBeFalsy();
    });

    test('isFile()', () => {
        expect(vfs.isFile('dist/hello.txt')).toBeTruthy();
        expect(vfs.isFile('dist')).toBeFalsy();
        expect(vfs.isFile('foo')).toBeTruthy();
        expect(vfs.isFile('this-file-does-not-exist')).toBeFalsy();

        // Check if path is normalized
        expect(vfs.isFile('////dist//hello.txt////')).toBeTruthy();
        expect(vfs.isFile('////dist////')).toBeFalsy();
        expect(vfs.isFile('////this-file-does-not-exist////')).toBeFalsy();
    });
});


import {hello} from './hello';

test('hello() should say hello', () => {
    expect(hello('World')).toEqual('Hello World!');
});

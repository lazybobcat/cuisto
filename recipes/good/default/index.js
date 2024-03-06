import {Command} from '@lazybobcat/cuisto-api';
import {confirm} from '@inquirer/prompts';

export default async function({vfs}) {
    console.log('This is a good recipe!');
    const answer = await confirm({message: 'Do you like it?', default: false});
    if (answer) {
        console.log('Glad to hear!');
    } else {
        console.log('Oh, sorry to hear that.');
    }

    vfs.write('hello.txt', 'Hello, world!');
    // console.log(vfs.tree());

    try {
        const result = await Command.run('ls -l');
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

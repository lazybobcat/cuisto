import {confirm} from '@inquirer/prompts';

export default async function () {
    console.log('This is a good recipe!');
    const answer = await confirm({message: 'Do you like it?', default: false});
    if (answer) {
        console.log('Glad to hear!');
    } else {
        console.log('Oh, sorry to hear that.');
    }
};

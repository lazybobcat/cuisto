import {addToEnvFile} from '@lazybobcat/cuisto-api';

export default async function({vfs, properties}) {
    console.log(properties);
    addToEnvFile(vfs, {
        NG_LISTEN_PORT: properties['ngListenPort'],
    });
};

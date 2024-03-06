import { DotEnv } from '@lazybobcat/cuisto-api';

export default async function({ vfs, properties }) {
    // console.log(properties);

    const dotenv = new DotEnv(vfs);
    dotenv.addEnvironmentVariables({
        NG_LISTEN_PORT: properties['ngListenPort'],
        SIMPLE: 'angular avec une "',
        COMPLEX: "L'application doit fonctionner",
        MULTILINE: "ligne 1\nLigne2\nLigne 3 avec une \" et enfin\n l'application doit fonctionner",
    });

    // DockerCompose.addService({
    //     'angular': {
    //         image: 'node:20',
    //         command: 'npm run start',
    //         environment: {
    //             NG_LISTEN_PORT: properties['ngListenPort'],
    //         },
    //         ports: [`${properties['ngListenPort']}:4200`],
    //         volumes: ['./:/app'],
    //         working_dir: '/app',
    //     }
    // });
};

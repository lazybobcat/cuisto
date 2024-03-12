import {DockerCompose, DotEnv, FileGenerator, Gitignore, Helper} from '@lazybobcat/cuisto-api';

export default async function({ vfs, properties, recipePath }) {
    // console.log(properties);
    // console.log(vfs.root);

    if(isNaN(Number(properties['ngListenPort']))) {
        return Helper.errorAndExit('Invalid port number');
    }

    const dotenv = new DotEnv(vfs);
    dotenv.addEnvironmentVariables({
        NG_LISTEN_PORT: properties['ngListenPort'],
    });

    const compose = new DockerCompose(vfs);
    compose.addServices({
        'node': {
            image: 'node:20-alpine',
            command: 'npm run start',
            environment: {
                NG_LISTEN_PORT: '${NG_LISTEN_PORT}',
            },
            ports: ['${NG_LISTEN_PORT}:4200'],
            volumes: ['../:/app'], // This is a relative path, it will be resolved to the '.compose' directory
            working_dir: '/app',
        }
    }, 'angular.compose.yaml');

    const gi = new Gitignore(vfs);
    gi.addPatterns([
        '/node_modules',
        '/dist',
        '/.env',
    ]);

    const fg = new FileGenerator(vfs);
    fg.generateFiles(`${recipePath}/files`, vfs.root, {
        project: properties['project'],
    });
};

import { DockerCompose, DotEnv } from '@lazybobcat/cuisto-api';

export default async function({ vfs, properties }) {
    // console.log(properties);

    const dotenv = new DotEnv(vfs);
    dotenv.addEnvironmentVariables({
        NG_LISTEN_PORT: properties['ngListenPort'],
    });

    const compose = new DockerCompose(vfs);
    compose.addService({
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
    });
};

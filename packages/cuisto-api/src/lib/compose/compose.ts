import {join} from 'path';

import {ComposeServices, DockerComposeConfiguration} from './compose-types';
import {doMerge, doParse, doStringify} from './compose-functions';
import {VirtualFS} from '../virtual-fs';

export class DockerCompose {
    private readonly domain: string;

    constructor(private readonly vfs: VirtualFS, private readonly filePath = 'docker-compose.yaml', private readonly composeDirectory = '.compose') {
        this.domain = process.env['RECIPE_NAME'] ? `${process.env['RECIPE_NAME'].replace(/@\/-/, '_')}` : 'unknown';
    }

    readConfiguration = (): DockerComposeConfiguration => {
        const content = this.vfs.read(this.filePath, 'utf-8');

        return doParse(content || '');
    };

    addServices = (services: ComposeServices): void => {
        // TODO : add unit tests for this method
        if (0 === Object.keys(services).length) {
            return;
        }

        const baseConfig = this.readConfiguration();
        const fileName = `${this.domain}.compose.yaml`;
        const serviceFilePath = join(this.composeDirectory, fileName);
        // push include path only if not already present
        if (!baseConfig.include || !baseConfig.include.includes(fileName)) {
            baseConfig.include = baseConfig.include || [];
            baseConfig.include.push(fileName);
        }

        // merge the services
        const serviceFileContent = doParse(this.vfs.read(serviceFilePath, 'utf-8') || '');
        this.vfs.write(serviceFilePath, doStringify(doMerge(serviceFileContent, {services: services})));
        this.vfs.write(this.filePath, doStringify(baseConfig));
    };

    // TODO: add more methods to manipulate the docker-compose.yaml file
    // - addNetwork
    // - addVolume
    // - removeXXX?
}


import {join} from 'path';

import {ComposeServices, ComposeVolumes, DockerComposeConfiguration} from './compose-types';
import {doMerge, doParse, doStringify} from './compose-functions';
import {VirtualFS} from '../virtual-fs';

export class DockerCompose {
    private readonly domain: string;

    constructor(private readonly vfs: VirtualFS, private readonly filePath = 'docker-compose.yaml', private readonly composeDirectory = '.compose') {
        this.domain = process.env['RECIPE_NAME'] ? `${process.env['RECIPE_NAME']?.replace(/[@/-]/, '_')}` : 'unknown';
    }

    readConfiguration = (): DockerComposeConfiguration => {
        const content = this.vfs.read(this.filePath, 'utf-8');

        return doParse(content || '');
    };

    addServices = (services: ComposeServices, fileName: string | null = null): void => {
        // TODO : add unit tests for this method
        if (0 === Object.keys(services).length) {
            return;
        }

        fileName = fileName || `${this.domain}.compose.yaml`;
        const baseConfig = this.readConfiguration();
        const filePath = join(this.composeDirectory, fileName);
        // push include path only if not already present
        if (!baseConfig.include || !baseConfig.include.includes(filePath)) {
            baseConfig.include = baseConfig.include || [];
            baseConfig.include.push(filePath);
        }

        // merge the services
        const fileContent = doParse(this.vfs.read(filePath, 'utf-8') || '');
        this.vfs.write(filePath, doStringify(doMerge(fileContent, {services: services})));
    };

    addVolumes = (volumes: ComposeVolumes, fileName: string | null = null): void => {
        // TODO : add unit tests for this method
        if (0 === Object.keys(volumes).length) {
            return;
        }

        fileName = fileName || `${this.domain}.compose.yaml`;
        const baseConfig = this.readConfiguration();
        const filePath = join(this.composeDirectory, fileName);
        // push include path only if not already present
        if (!baseConfig.include || !baseConfig.include.includes(filePath)) {
            baseConfig.include = baseConfig.include || [];
            baseConfig.include.push(filePath);
        }

        // merge the services
        const fileContent = doParse(this.vfs.read(filePath, 'utf-8') || '');
        this.vfs.write(filePath, doStringify(doMerge(fileContent, {volumes: volumes})));
    };

    // TODO: add more methods to manipulate the docker-compose.yaml file
    // - addNetwork
    // - removeXXX?
}


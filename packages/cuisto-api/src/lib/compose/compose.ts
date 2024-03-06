import {join} from 'path';

import {ComposeService, DockerComposeConfiguration} from './compose_types';
import {doParse, doStringify} from './compose_functions';
import {VirtualFS} from '../virtual-fs';

export class DockerCompose {
    private readonly domain: string;

    constructor(private readonly vfs: VirtualFS, private readonly filePath = 'docker-compose.yaml', private readonly composeDirectory = '.compose') {
        this.domain = process.env['RECIPE_NAME'] ? `${process.env['RECIPE_NAME'].replace(/@\/-/, '_')}_` : '';
    }

    readConfiguration = (): DockerComposeConfiguration => {
        const content = this.vfs.read(this.filePath, 'utf-8');

        return doParse(content || '');
    };

    addService = (service: ComposeService): void => {
        if (0 === Object.keys(service).length) {
            return;
        }

        const baseConfig = this.readConfiguration();
        const name = Object.keys(service)[0];
        const serviceFilePath = join(this.composeDirectory, `${this.domain}${name}.yaml`);
        baseConfig.include ? baseConfig.include.push(serviceFilePath) : baseConfig.include = [serviceFilePath];

        const composeContent = doStringify({services: service});
        this.vfs.write(serviceFilePath, composeContent);
        this.vfs.write(this.filePath, doStringify(baseConfig));
    };

    // TODO: add more methods to manipulate the docker-compose.yaml file
    // - addNetwork
    // - addVolume
    // - removeXXX?
}


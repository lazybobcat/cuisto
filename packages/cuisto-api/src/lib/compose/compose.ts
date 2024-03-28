import {ComposeServices, ComposeVolumes, DockerComposeConfiguration} from './compose-types';
import {doMerge, doParse, doStringify} from './compose-functions';
import {VirtualFS} from '../virtual-fs';

export class DockerCompose {

    // eslint-disable-next-line no-empty-function
    constructor(private readonly vfs: VirtualFS, private readonly filePath: string, private readonly includeInComposeFile: string | null = null) {}

    readConfiguration = (): DockerComposeConfiguration => {
        const content = this.vfs.read(this.filePath, 'utf-8');

        return doParse(content || '');
    };

    readParentConfiguration = (): DockerComposeConfiguration => {
        if (null === this.includeInComposeFile) {
            return doParse('');
        }

        const content = this.vfs.read(this.includeInComposeFile, 'utf-8');

        return doParse(content || '');
    };

    addServices = (services: ComposeServices): void => {
        // TODO : add unit tests for this method
        if (0 === Object.keys(services).length) {
            return;
        }

        if (null !== this.includeInComposeFile) {
            const baseConfig = this.readParentConfiguration();
            // push include path only if not already present
            if (!baseConfig.include || !baseConfig.include.includes(this.filePath)) {
                baseConfig.include = baseConfig.include || [];
                baseConfig.include.push(this.filePath);
                this.vfs.write(this.includeInComposeFile, doStringify(baseConfig));
            }
        }

        // merge the services
        const fileContent = doParse(this.vfs.read(this.filePath, 'utf-8') || '');
        this.vfs.write(this.filePath, doStringify(doMerge(fileContent, {services: services})));
    };

    addVolumes = (volumes: ComposeVolumes): void => {
        // TODO : add unit tests for this method
        if (0 === Object.keys(volumes).length) {
            return;
        }

        if (null !== this.includeInComposeFile) {
            const baseConfig = this.readParentConfiguration();
            // push include path only if not already present
            if (!baseConfig.include || !baseConfig.include.includes(this.filePath)) {
                baseConfig.include = baseConfig.include || [];
                baseConfig.include.push(this.filePath);
                this.vfs.write(this.includeInComposeFile, doStringify(baseConfig));
            }
        }

        // merge the services
        const fileContent = doParse(this.vfs.read(this.filePath, 'utf-8') || '');
        this.vfs.write(this.filePath, doStringify(doMerge(fileContent, {volumes: volumes})));
    };

    // TODO: add more methods to manipulate the docker-compose.yaml file
    // - addNetwork
    // - removeXXX?
}


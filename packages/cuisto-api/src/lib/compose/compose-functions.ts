import {DockerComposeConfiguration} from './compose-types';
import {Yaml} from '../yaml';

export const doParse = (content: string): DockerComposeConfiguration => {
    return Yaml.parse(content) ?? {};
};

export const doStringify = (configurations: DockerComposeConfiguration): string => {
    return Yaml.stringify(configurations);
};

export const doMerge = (base: DockerComposeConfiguration, toMerge: DockerComposeConfiguration): DockerComposeConfiguration => {
    const merged: DockerComposeConfiguration = {
        ...base,
        ...toMerge,
    };

    if (toMerge.include || base.include) {
        merged.include = [
            ...(base.include || []),
            ...(toMerge.include || []),
        ];
    }

    if (toMerge.services || base.services) {
        merged.services = {
            ...base.services,
            ...toMerge.services,
        };
    }

    if (toMerge.volumes || base.volumes) {
        merged.volumes = {
            ...base.volumes,
            ...toMerge.volumes,
        };
    }

    if (toMerge.networks || base.networks) {
        merged.networks = {
            ...base.networks,
            ...toMerge.networks,
        };
    }

    return merged;
};

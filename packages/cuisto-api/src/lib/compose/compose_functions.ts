import {DockerComposeConfiguration} from './compose_types';
import {Yaml} from '../yaml';

export const doParse = (content: string): DockerComposeConfiguration => {
    return Yaml.parse(content) ?? {};
};

export const doStringify = (configurations: DockerComposeConfiguration): string => {
    return Yaml.stringify(configurations);
};

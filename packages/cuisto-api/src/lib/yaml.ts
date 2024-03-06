import yaml from 'js-yaml';

export class Yaml {
    static parse<T = unknown>(data: string): T {
        return yaml.load(data) as T;
    }

    static stringify<T = unknown>(data: T): string {
        return yaml.dump(data);
    }
}

import {doMerge, doParse, doStringify} from './dotenv-functions';
import {VirtualFS} from '../virtual-fs';

export class DotEnv {
    // eslint-disable-next-line no-empty-function
    constructor(private readonly vfs: VirtualFS, private readonly filePath = '.env') {}

    readEnvironmentVariables = (): Record<string, string> => {
        const content = this.vfs.read(this.filePath, 'utf-8');

        return doParse(content || '');
    };

    addEnvironmentVariables = (configurations: Record<string, string>): void => {
        if (0 === Object.keys(configurations).length) {
            return;
        }

        const fileContent = doParse(this.vfs.read(this.filePath, 'utf-8') || '');
        this.vfs.write(this.filePath, doStringify(doMerge(fileContent, configurations)));
    };
}


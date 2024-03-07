import {doParse, doStringify} from './dotenv-functions';
import {VirtualFS} from '../virtual-fs';

export class DotEnv {
    private readonly domain: string;

    constructor(private readonly vfs: VirtualFS, private readonly filePath = '.env') {
        this.domain = process.env['RECIPE_NAME'] || '';
    }

    readEnvironmentVariables = (): Record<string, string> => {
        const content = this.vfs.read(this.filePath, 'utf-8');

        return doParse(content || '');
    };

    addEnvironmentVariables = (configurations: Record<string, string>): void => {
        if (0 === Object.keys(configurations).length) {
            return;
        }

        const fileContent = this.vfs.read(this.filePath, 'utf-8') || '';
        const envContent = doStringify(configurations, this.domain);

        this.vfs.write(this.filePath, fileContent + envContent);
    };
}


import {checkbox, confirm, input as promptInput, select} from '@inquirer/prompts';
import chalk from 'chalk';

const notEmpty = (value: string) => value.trim().length > 0;
let _input: Input | null = null;
export const input = () => {
    if (!_input) {
        _input = new Input();
    }

    return _input;
};

class Input {
    async string(message: string, defaultValue: string | undefined = undefined, required = false): Promise<string> {
        return await promptInput({message, default: defaultValue, validate: required ? notEmpty : undefined});
    }

    async number(message: string, defaultValue: number | undefined = undefined, required = false): Promise<number> {
        const result = await promptInput({
            message,
            default: defaultValue ? defaultValue.toString() : undefined,
            validate: required ? notEmpty : undefined,
        });

        return Number(result);
    }

    async boolean(message: string, defaultValue: boolean | undefined = undefined): Promise<boolean> {
        return await confirm({message, default: defaultValue});
    }

    async choice(message: string, choices: { name?: string; value: string }[], multiple = false, required = false): Promise<string | string[]> {
        if (multiple) {
            return await checkbox({message, choices, required, theme: {
                icon: {
                    checked: chalk.green('✔'),
                    unchecked: chalk.red('✖'),
                    cursor: '❯',
                }
            }});
        }

        return await select({message, choices});
    }
}

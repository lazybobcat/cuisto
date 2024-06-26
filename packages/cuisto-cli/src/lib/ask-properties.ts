import {input, verbose} from '@lazybobcat/cuisto-api';
import {Ora} from 'ora';

type Property =
    | {
        type: 'string' | 'number';
        description: string;
        default?: string;
        required?: boolean;
    }
    | {
        type: 'boolean';
        description: string;
        default?: boolean;
        required?: boolean;
    }
    | {
        type: 'choice';
        description: string;
        choices: { name?: string; value: string }[];
        multiple?: false;
        default?: string;
        required?: boolean;
    }
    | {
        type: 'choice';
        description: string;
        choices: { name?: string; value: string }[];
        multiple: true;
        required?: boolean;
    }
;

export type Properties = {
    [property: string]: Property;
};

export type FlatProperties = { [property: string]: string | number | boolean | string[]; };

export const askProperties = async (
    properties: Properties,
    providedValues: FlatProperties,
    options: {yes: boolean, verbose: number},
    spinner: Ora
): Promise<FlatProperties> => {
    const answers: { [property: string]: string | number | boolean | string[] } = {};

    for (const [property, definition] of Object.entries(properties)) {
        let result: string | number | boolean | string[] | undefined;

        // If the value has been provided as an option, we set it and continue
        if (property in providedValues) {
            const r = providedValues[property];
            if (r) {
                answers[property] = r;
                continue;
            }
        }

        // If yes is true and the property has a default value, we set it and continue
        if (options.yes) {
            if ('default' in definition && undefined !== definition.default) {
                result = definition.default;
                answers[property] = result;
                continue;
            }
            if (true !== definition.required) {
                continue;
            }
        }

        // Pause the spinner while prompt is active
        spinner.stopAndPersist();
        console.log('\n'); // Add a line break to separate the prompt from the previous output
        switch (definition.type) {
            case 'string':
            case 'number':
                result = await input().string(definition.description, definition.default, definition.required);
                answers[property] = result;
                break;

            case 'boolean':
                result = await input().boolean(definition.description, definition.default);
                answers[property] = result;
                break;

            case 'choice':
                if (definition.multiple) {
                    result = await input().choice(definition.description, definition.choices, true, definition.required);
                    answers[property] = result;
                } else {
                    result = await input().choice(definition.description, definition.choices, false, definition.required);
                    answers[property] = result;
                }
                break;
        }
        verbose(`Property ${property} set to ${result}`, {verbose: options.verbose});
        spinner.start();
    }

    return answers;
};


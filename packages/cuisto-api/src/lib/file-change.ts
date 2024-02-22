import {Mode} from 'fs';

export type FileChange = {
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    content: Buffer | null;
    mode?: Mode;
}

export type Changes = {
    [path: string]: FileChange;
}

export const changeIsFile = (change: FileChange | Changes): change is FileChange => {
    return 'object' === typeof change && null !== change && 'operation' in change;
};
export const changeIsDirectory = (change: FileChange | Changes): change is Changes => {
    return 'object' === typeof change && null !== change && !('operation' in change);
};

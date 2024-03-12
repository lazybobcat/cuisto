import {execa} from 'execa';

export const findRepositoryUrl = async (recipeSources: string[], recipe: string, branch: string): Promise<string | null> => {
    let url: string | null = null;
    for (const source of recipeSources) {
        const git = `${source}/${recipe}.git`;
        // Check if the recipe exists in the source (github, gitlab, etc.)
        try {
            await execa('git', ['ls-remote', '--heads', '--exit-code', git, `refs/heads/${branch}`]);
            url = git;
        } catch (_) {
            continue;
        }
    }

    return url;
};

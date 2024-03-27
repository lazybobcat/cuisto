export type ComposeServices = {
    [name: string]: {
        image: string;
        ports?: string[];
        volumes?: string[];
        environment?: {
            [name: string]: string;
        };
    };
}

export type ComposeVolumes = {
    [name: string]: string;
}

// TODO: complete this structure
export type DockerComposeConfiguration = {
    version?: string;
    include?: string[];
    services?: ComposeServices;
    volumes?: ComposeVolumes;
    networks?: {
        [name: string]: {
            driver: string;
        };
    };
}

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

// TODO: complete this structure
export type DockerComposeConfiguration = {
    version?: string;
    include?: string[];
    services?: ComposeServices;
    volumes?: {
        [name: string]: string;
    };
    networks?: {
        [name: string]: {
            driver: string;
        };
    };
}

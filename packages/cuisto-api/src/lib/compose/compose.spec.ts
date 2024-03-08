import {doMerge, doParse, doStringify} from './compose-functions';

// generate test functions doParse and doStringify from compose.ts which must be used with a docker compose yaml configuration
describe('doParse', () => {
    test('should return an empty map when the content is empty', () => {
        const content = '';
        const result = doParse(content);
        expect(result).toEqual({});
    });

    test('should return a map with the parsed content', () => {
        const content = `
version: '3.8'
services:
  my-service:
    image: my-image
    ports:
      - "8080:8080"
    volumes:
      - my-volume:/path
    environment:
      MY_ENV: my-value
volumes:
    my-volume: my-driver
networks:
    my-network:
      driver: bridge
`;
        const result = doParse(content);
        expect(result).toEqual({
            version: '3.8',
            services: {
                'my-service': {
                    image: 'my-image',
                    ports: ['8080:8080'],
                    volumes: ['my-volume:/path'],
                    environment: {
                        MY_ENV: 'my-value'
                    }
                }
            },
            volumes: {
                'my-volume': 'my-driver'
            },
            networks: {
                'my-network': {
                    driver: 'bridge'
                }
            }
        });
    });
});

describe('doStringify', () => {
    test('should generate a string with the service', () => {
        const service = {
            'my-service': {
                image: 'my-image',
                ports: ['8080:8080'],
                volumes: ['my-volume:/path'],
                environment: {
                    MY_ENV: 'my-value'
                }
            }
        };
        const result = doStringify({services: service});
        expect(result).toEqual(`services:
  my-service:
    image: my-image
    ports:
      - '8080:8080'
    volumes:
      - my-volume:/path
    environment:
      MY_ENV: my-value
`);
    });
});

describe('doMerge', () => {
    test('should merge the configurations', () => {
        const base = {
            version: '3.8',
            services: {
                'my-service': {
                    image: 'my-image',
                }
            },
            volumes: {
                'my-other-volume': 'my-other-driver'
            }
        };
        const toMerge = {
            volumes: {
                'my-volume': 'my-driver'
            },
            services: {
                'my-other-service': {
                    image: 'my-other-image',
                }
            }
        };
        const result = doMerge(base, toMerge);
        expect(result).toEqual({
            version: '3.8',
            volumes: {
                'my-volume': 'my-driver',
                'my-other-volume': 'my-other-driver'
            },
            services: {
                'my-service': {
                    image: 'my-image',
                },
                'my-other-service': {
                    image: 'my-other-image',
                }
            }
        });
    });

    test('should override the services', () => {
        const base = {
            services: {
                'my-service': {
                    image: 'my-image',
                    ports: ['8080:8080'],
                    volumes: ['my-volume:/path'],
                    environment: {
                        MY_ENV: 'my-value'
                    }
                }
            }
        };
        const toMerge = {
            services: {
                'my-service': {
                    image: 'my-other-image',
                    ports: ['8081:8081'],
                    environment: {
                        MY_OTHER_ENV: 'my-other-value'
                    }
                }
            }
        };
        const result = doMerge(base, toMerge);
        expect(result).toEqual({
            services: {
                'my-service': {
                    image: 'my-other-image',
                    ports: ['8081:8081'],
                    environment: {
                        MY_OTHER_ENV: 'my-other-value'
                    }
                }
            }
        });
    });

    test('should override specific services and merge other configurations', () => {
        const base = {
            volumes: {
                'my-volume': 'my-driver'
            },
            services: {
                'my-service': {
                    image: 'my-image',
                    ports: ['8080:8080'],
                },
                'my-other-service': {
                    image: 'my-other-image',
                    ports: ['8081:8081'],
                }
            }
        };
        const toMerge = {
            volumes: {
                'my-other-volume': 'my-other-driver'
            },
            services: {
                'my-service': {
                    image: 'my-other-image',
                    ports: ['8081:8081'],
                    environment: {
                        MY_OTHER_ENV: 'my-other-value'
                    }
                }
            }
        };
        const result = doMerge(base, toMerge);
        expect(result).toEqual({
            volumes: {
                'my-volume': 'my-driver',
                'my-other-volume': 'my-other-driver'
            },
            services: {
                'my-service': {
                    image: 'my-other-image',
                    ports: ['8081:8081'],
                    environment: {
                        MY_OTHER_ENV: 'my-other-value'
                    }
                },
                'my-other-service': {
                    image: 'my-other-image',
                    ports: ['8081:8081'],
                }
            }
        });
    });
});

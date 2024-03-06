import {doParse, doStringify} from './compose_functions';

// generate test functions doParse and doStringify from compose.ts which must be used with a docker compose yaml configuration
describe('DockerCompose.readConfiguration', () => {
    it('should return an empty map when the content is empty', () => {
        const content = '';
        const result = doParse(content);
        expect(result).toEqual({});
    });

    it('should return a map with the parsed content', () => {
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

describe('DockerCompose.addService', () => {
    it('should generate a string with the service', () => {
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

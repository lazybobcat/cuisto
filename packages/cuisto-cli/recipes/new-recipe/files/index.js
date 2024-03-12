import {Command} from '@lazybobcat/cuisto-api';

/**
 * The default function will be executed by cuisto. You can use this function to run commands, create or manupulate
 * files in the Virtual File System (VFS). You can also use the properties object to access the user input.
 * @param {VirtualFS} vfs The Virtual File System, changes to files on the VFS will only be applied to the real file
 * system after the function has finished executing, upon user confirmation.
 * @param {Object} properties The properties object contains the user input corresponding to the schema.json
 * "properties" field.
 * @param {String} recipePath The path to the recipe directory. Useful to generate files with the FileGenerator.
 */
export default async function({ vfs, properties, recipePath }) {
    Command.run('echo "Hello, <%= recipeName %>!');

    // You can use the vfs to create files
    // vfs.write('path/to/file', 'file content');

    // You can also use the FileGenerator to create files from a template
    // const fg = new FileGenerator(vfs);
    // fg.generateFiles(`${recipePath}/files`, vfs.root, properties);
    // The first argument is the path to the template files, the second argument is the root path where the files will
    // be generated, and the third argument is the properties in order to replace the placeholders in the template
    // files. For example, if you have `<%%= name %>` in a file, and you pass `{ name: 'John' }` as the properties, the
    // placeholder will be replaced with `John`.

    // You can run commands using the Command class
    // Command.run('echo "Hello, <%= recipeName %>!');

    // You can create environment variables to the .env file
    // const dotenv = new DotEnv(vfs);
    // dotenv.addEnvironmentVariables({
    //    MY_ENV_VAR: 'my value',
    //    ANOTHER_ENV_VAR: 'another value',
    //    ...
    // });

    // You can create and include services to the docker-compose file
    // const compose = new DockerCompose(vfs);
    // compose.addServices({
    //    'service-name': {
    //      image: 'image-name',
    //    }
    // }, 'docker-compose-file-name.yaml');
    // The first argument is an object containing the services to add, and the second argument is the name of the
    // docker-compose file. By default, compose files are added to the .compose directory and included in the
    // docker-compose.yaml file.

    // You can ignore patterns in the .gitignore file
    // const gi = new Gitignore(vfs);
    // gi.addPatterns([
    //   '/node_modules',
    //   '/dist',
    // ]);

    // You can also use the Helper class to display messages and errors
    // Helper.errorAndExit('An error occurred');

    // Feel free to implement your own logic here
}

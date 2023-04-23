import { mkdirSync, writeFileSync, readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { render } from 'mustache';

interface AppConfig {
    name: string;
    path: string;
}

function main(): void {
    const config = readConfig();

    createApp(config);
}

function readConfig(): AppConfig {
    const name = process.argv[2];

    if (!name) {
        console.error('Missing app name!');
        process.exit(1);
    }

    return {
        name: basename(name),
        path: `${process.cwd()}/${name}/`
    };
}

function createApp(config: AppConfig): void {
    if (existsSync(config.path)) {
        console.error(`Folder '${config.name}' already exists!`);
        process.exit(1);
    }

    console.log(`Creating app ${config.name}...`);

    const templatePath = resolve(__dirname, '../template');

    for (const file of getDirectoryFiles(templatePath)) {
        const relativePath = file.substring(templatePath.length + 1);
        const fileContents = readFileSync(file).toString();

        writeFile(config.path + relativePath, render(fileContents, { config }));
    }

    console.log('Done!');
}

function writeFile(path: string, contents: string): void {
    if (!existsSync(dirname(path))) {
        mkdirSync(dirname(path), { recursive: true });
    }

    writeFileSync(path, contents);
}

function getDirectoryFiles(dir: string): string[] {
    const children = readdirSync(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const child of children) {
        const path = resolve(dir, child.name);

        if (child.isDirectory()) {
            files.push(...getDirectoryFiles(path));
        } else {
            files.push(path);
        }
    }

    return files;
}

main();

import { arrayFrom } from '@noeldemartin/utils';
import { Project } from 'ts-morph';
import type { SourceFile } from 'ts-morph';

import File from '@aerogel/cli/lib/File';
import Log from '@aerogel/cli/lib/Log';
import Shell from '@aerogel/cli/lib/Shell';

export class Editor {

    private project: Project;
    private modifiedFiles: Set<string>;

    constructor() {
        this.project = new Project({ tsConfigFilePath: 'tsconfig.json' });
        this.modifiedFiles = new Set();

        this.project.addSourceFilesAtPaths('src/**/*.ts');
        this.project.addSourceFilesAtPaths('vite.config.ts');
        this.project.addSourceFilesAtPaths('package.json');
    }

    public addSourceFile(path: string): void {
        this.project.addSourceFilesAtPaths(path);
    }

    public requireSourceFile(path: string): SourceFile {
        return this.project.getSourceFileOrThrow(path);
    }

    public async format(): Promise<void> {
        await Log.animate('Formatting modified files', async () => {
            const usingPrettier = File.exists('prettier.config.js') || File.contains('package.json', '"prettier": {');
            const usingESLint = File.exists('.eslintrc.js') || File.contains('package.json', '"eslintConfig"');
            const usingPrettierESLint = File.contains('package.json', '"prettier-eslint-cli"');
            const formatFile = usingPrettierESLint
                ? (file: string) => Shell.run(`npx prettier-eslint ${file} --write`)
                : async (file: string) => {
                    usingPrettier && (await Shell.run(`npx prettier ${file} --write`));
                    file.match(/\.(ts|js|vue)$/) && usingESLint && (await Shell.run(`npx eslint ${file} --fix`));
                };

            await Promise.all(arrayFrom(this.modifiedFiles).map(async (file) => formatFile(file)));
        });
    }

    public async save(file: SourceFile): Promise<void> {
        await file.save();

        this.addModifiedFile(file.getFilePath());
    }

    public addModifiedFile(path: string): void {
        this.modifiedFiles.add(path);
    }

}

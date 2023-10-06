import { arrayFrom } from '@noeldemartin/utils';
import { Project } from 'ts-morph';
import type { SourceFile } from 'ts-morph';

import File from '@/lib/File';
import Log from '@/lib/Log';
import Shell from '@/lib/Shell';

export class Editor {

    private project: Project;
    private modifiedFiles: Set<string>;

    constructor() {
        this.project = new Project({ tsConfigFilePath: 'tsconfig.json' });
        this.modifiedFiles = new Set();

        this.project.addSourceFilesAtPaths('src/**/*.ts');
        this.project.addSourceFilesAtPaths('tailwind.config.js');
        this.project.addSourceFilesAtPaths('vite.config.ts');
    }

    public addSourceFile(path: string): void {
        this.project.addSourceFilesAtPaths(path);
    }

    public requireSourceFile(path: string): SourceFile {
        return this.project.getSourceFileOrThrow(path);
    }

    public async format(): Promise<void> {
        await Log.animate('Formatting modified files', async () => {
            const usingPrettier = File.exists('prettier.config.js');
            const usingESLint = File.exists('.eslintrc.js');

            await Promise.all(
                arrayFrom(this.modifiedFiles).map(async (file) => {
                    usingPrettier && (await Shell.run(`npx prettier ${file} --write`));
                    usingESLint && (await Shell.run(`npx eslint ${file} --fix`));
                }),
            );
        });
    }

    public async save(file: SourceFile): Promise<void> {
        await file.save();

        this.modifiedFiles.add(file.getFilePath());
    }

}

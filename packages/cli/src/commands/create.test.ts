import { describe, it } from 'vitest';

import FileMock from '@/lib/File.mock';
import ShellMock from '@/lib/Shell.mock';

import { CreateCommand } from './create';

describe('Create command', () => {

    it('creates apps', async () => {
        // Act
        await CreateCommand.run('./app', { name: 'My App' });

        // Assert
        FileMock.expectCreated('./app/.gitignore').toContain('node_modules');
        FileMock.expectCreated('./app/package.json').toContain('"name": "my-app"');
        FileMock.expectCreated('./app/package.json').toContain('"@aerogel/core": "next"');
        FileMock.expectCreated('./app/index.html').toContain('{{ app.name }}');
        FileMock.expectCreated('./app/README.md').toContain('My App');
        FileMock.expectCreated('./app/src/App.vue').toContain('<h1 class="text-4xl font-semibold">');
        FileMock.expectCreated('./app/src/App.vue').toContain('{{ $t(\'home.title\') }}');

        ShellMock.expectRan('npm install');
        ShellMock.expectRan('git init');
    });

    it('creates apps for local core development', async () => {
        // Act
        await CreateCommand.run('./app', { name: 'My App', local: true });

        // Assert
        FileMock.expectCreated('./app/package.json').toMatch(/"@aerogel\/core": "file:[^"]+\/packages\/core"/);
    });

    it('infers app name from path', async () => {
        // Act
        await CreateCommand.run('./my-app');

        // Assert
        FileMock.expectCreated('./my-app/package.json').toContain('"name": "my-app"');
    });

});

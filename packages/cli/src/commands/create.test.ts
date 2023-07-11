import { describe, expect, it } from 'vitest';

import File from '@/lib/File';
import FileMock from '@/lib/File.mock';
import ShellMock from '@/lib/Shell.mock';
import { basePath } from '@/lib/utils';

import { CreateCommand } from './create';

describe('Create', () => {

    it('works', async () => {
        // Act
        await new CreateCommand('./app', { name: 'My App' }).run();

        // Assert
        expect(File.getFiles).toHaveBeenCalledWith(basePath('template'));

        FileMock.expectCreated('./app/package.json').toContain('"name": "my-app"');
        FileMock.expectCreated('./app/index.html').toContain('My App');
        FileMock.expectCreated('./app/src/App.vue').toContain(
            '<h1 class="text-4xl font-semibold">{{ $t(\'home.title\') }}</h1>',
        );

        ShellMock.expectRan('npm install');
        ShellMock.expectRan('git init');
    });

});

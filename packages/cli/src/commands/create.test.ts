import { describe, it } from 'vitest';

import FileMock from '@aerogel/cli/lib/File.mock';
import ShellMock from '@aerogel/cli/lib/Shell.mock';

import { CreateCommand } from './create';

describe('Create command', () => {

    it('creates apps', async () => {
        // Act
        await CreateCommand.run('./app', { name: 'My App' });

        // Assert
        FileMock.expectCreated('./app/README.md').toContain('My App');

        ShellMock.expectRan('git init');
    });

});

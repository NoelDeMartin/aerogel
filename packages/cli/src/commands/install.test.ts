import { describe, it } from 'vitest';

import ShellMock from '@/lib/Shell.mock';

import { InstallCommand } from './install';

describe('Install plugin command', () => {

    it('installs plugins', async () => {
        // Act
        await InstallCommand.run('solid');

        // Assert
        ShellMock.expectRan('npm install soukai-solid@next');
        ShellMock.expectRan('npm install @aerogel/plugin-solid@next');
    });

});

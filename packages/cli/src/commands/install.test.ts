import { describe, it } from 'vitest';

import ShellMock from '@aerogel/cli/lib/Shell.mock';

import { InstallCommand } from './install';

describe('Install plugin command', () => {

    it('installs solid', async () => {
        // Act
        await InstallCommand.run('solid');

        // Assert
        ShellMock.expectRan('npm install soukai-solid@next --save-exact');
        ShellMock.expectRan('npm install @aerogel/plugin-solid@next --save-exact');
    });

    it('installs soukai', async () => {
        // Act
        await InstallCommand.run('soukai');

        // Assert
        ShellMock.expectRan('npm install soukai@next --save-exact');
        ShellMock.expectRan('npm install @aerogel/plugin-soukai@next --save-exact');
    });

    it('installs local-first', async () => {
        // Act
        await InstallCommand.run('local-first');

        // Assert
        ShellMock.expectRan('npm install @aerogel/plugin-local-first@next --save-exact');
    });

});

import { describe, it } from 'vitest';

import FileMock from '@/lib/File.mock';
import ShellMock from '@/lib/Shell.mock';

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

    it('installs histoire', async () => {
        // Arrange
        FileMock.stub('package.json', '"@aerogel/core"');

        // Act
        await InstallCommand.run('histoire');

        // Assert
        ShellMock.expectRan('npm install histoire@0.17.6 --save-dev');
        ShellMock.expectRan('npm install @aerogel/histoire@next --save-exact');
        ShellMock.expectRan('npm install patch-package --save-dev');
    });

});

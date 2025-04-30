import { describe, expect, it } from 'vitest';

import ShellMock from '@aerogel/cli/lib/Shell.mock';
import FileMock from '@aerogel/cli/lib/File.mock';

import { InstallCommand } from './install';

describe('Install plugin command', () => {

    it('installs solid', async () => {
        // Arrange
        stubPackageJson();

        // Act
        await InstallCommand.run('solid');

        // Assert
        ShellMock.expectRan('pnpm install --no-save');

        expectPackageJson({
            dependencies: {
                '@aerogel/core': 'next',
                '@aerogel/plugin-solid': 'next',
                '@noeldemartin/solid-utils': 'next',
                'soukai-solid': 'next',
                'vue': '^3.5.13',
            },
        });
    });

    it('installs soukai', async () => {
        // Arrange
        stubPackageJson();

        // Act
        await InstallCommand.run('soukai', { skipInstall: true });

        // Assert
        ShellMock.expectNotRan('pnpm install --no-save');

        expectPackageJson({
            dependencies: {
                '@aerogel/core': 'next',
                '@aerogel/plugin-soukai': 'next',
                'soukai': 'next',
                'vue': '^3.5.13',
            },
        });
    });

    it('installs local-first', async () => {
        // Arrange
        stubPackageJson();

        // Act
        await InstallCommand.run('local-first');

        // Assert
        ShellMock.expectRan('pnpm install --no-save');

        expectPackageJson({
            dependencies: {
                '@aerogel/core': 'next',
                '@aerogel/plugin-local-first': 'next',
                'vue': '^3.5.13',
            },
        });
    });

});

function stubPackageJson(): void {
    FileMock.stub(
        'package.json',
        JSON.stringify(
            {
                dependencies: {
                    '@aerogel/core': 'next',
                    'vue': '^3.5.13',
                },
            },
            null,
            2,
        ),
    );
}

function expectPackageJson(packageJson: object): void {
    expect(JSON.parse(FileMock.read('package.json') ?? '{}')).toEqual(packageJson);
}

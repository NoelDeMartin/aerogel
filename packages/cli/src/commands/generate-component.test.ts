import { describe, it } from 'vitest';

import FileMock from '@aerogel/cli/lib/File.mock';

import { GenerateComponentCommand } from './generate-component';

describe('Generate Component command', () => {

    it('generates components', async () => {
        // Arrange
        FileMock.stub('package.json', '@aerogel/core');

        // Act
        await GenerateComponentCommand.run('FooBar');

        // Assert
        FileMock.expectCreated('src/components/FooBar.vue').toContain('<div>FooBar</div>');
    });

    it('generates components in subfolders', async () => {
        // Arrange
        FileMock.stub('package.json', '@aerogel/core');

        // Act
        await GenerateComponentCommand.run('module/FooBar');

        // Assert
        FileMock.expectCreated('src/components/module/FooBar.vue').toContain('<div>FooBar</div>');
    });

});

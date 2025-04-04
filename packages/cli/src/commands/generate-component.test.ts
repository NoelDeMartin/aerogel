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

    it('generates components with stories', async () => {
        // Arrange
        FileMock.stub(
            'package.json',
            `
                "@aerogel/core": "*",
                "histoire": "*"
            `,
        );

        // Act
        await GenerateComponentCommand.run('FooBar', { story: true });

        // Assert
        FileMock.expectCreated('src/components/FooBar.vue').toContain('<div>FooBar</div>');
        FileMock.expectCreated('src/components/FooBar.story.vue').toContain('<FooBar />');
    });

    it('generates input components with stories', async () => {
        // Arrange
        FileMock.stub(
            'package.json',
            `
                "@aerogel/core": "*",
                "histoire": "*"
            `,
        );

        // Act
        await GenerateComponentCommand.run('FooBar', { input: true, story: true });

        // Assert
        FileMock.expectCreated('src/components/FooBar.vue').toContain('<AGHeadlessInputInput v-bind="attrs" />');
        FileMock.expectCreated('src/components/FooBar.story.vue').toContain('.story-foobar .variant-playground');
        FileMock.expectCreated('src/components/FooBar.story.vue').toContain(
            '<FooBar name="food" :label="label" :placeholder="placeholder" />',
        );
    });

    it('generates button components with stories', async () => {
        // Arrange
        FileMock.stub(
            'package.json',
            `
                "@aerogel/core": "*",
                "histoire": "*"
            `,
        );

        // Act
        await GenerateComponentCommand.run('FooBar', { button: true, story: true });

        // Assert
        FileMock.expectCreated('src/components/FooBar.vue').toContain(
            '<HeadlessButton :class="variantClasses" :disabled="disabled">',
        );
        FileMock.expectCreated('src/components/FooBar.story.vue').toContain('.story-foobar .variant-playground');
        FileMock.expectCreated('src/components/FooBar.story.vue').toContain('<FooBar :color="color">');
    });

});

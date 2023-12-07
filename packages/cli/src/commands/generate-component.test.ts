import { beforeEach, describe, it } from 'vitest';

import FileMock from '@/lib/File.mock';
import { stubCommandRunner } from '@/testing/utils';
import type { StubCommandRunner } from '@/testing/utils';

import { GenerateComponentCommand } from './generate-component';

describe('Generate Component command', () => {

    let run: StubCommandRunner<typeof GenerateComponentCommand>;

    beforeEach(() => {
        run = stubCommandRunner(GenerateComponentCommand);
    });

    it('generates components', async () => {
        // Arrange
        FileMock.stub('package.json', '@aerogel/core');

        // Act
        await run('FooBar');

        // Assert
        FileMock.expectCreated('src/components/FooBar.vue').toContain('<div>FooBar</div>');
    });

    it('generates components in subfolders', async () => {
        // Arrange
        FileMock.stub('package.json', '@aerogel/core');

        // Act
        await run('module/FooBar');

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
        await run('FooBar', { story: true });

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
        await run('FooBar', { input: true, story: true });

        // Assert
        FileMock.expectCreated('src/components/FooBar.vue').toContain('<AGHeadlessInputInput v-bind="attrs" />');
        FileMock.expectCreated('src/components/FooBar.story.vue').toContain('.story-foobar .variant-playground');
        FileMock.expectCreated('src/components/FooBar.story.vue').toContain(
            '<FooBar name="food" :label="label" :placeholder="placeholder" />',
        );
    });

});

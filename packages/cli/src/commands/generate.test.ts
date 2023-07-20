import { describe, it } from 'vitest';

import FileMock from '@/lib/File.mock';

import { GenerateCommand } from './generate';

describe('Generate', () => {

    it('generates components', async () => {
        // Act
        await new GenerateCommand('component', 'FooBar').run();

        // Assert
        FileMock.expectCreated('./src/components/FooBar.vue').toContain('<div>FooBar</div>');
    });

    it('generates components with stories', async () => {
        // Act
        await new GenerateCommand('component', 'FooBar', { story: true }).run();

        // Assert
        FileMock.expectCreated('./src/components/FooBar.vue').toContain('<div>FooBar</div>');
        FileMock.expectCreated('./src/components/FooBar.story.vue').toContain('<FooBar />');
    });

});

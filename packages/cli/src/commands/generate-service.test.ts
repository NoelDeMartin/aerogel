import { describe, it } from 'vitest';

import FileMock from '@/lib/File.mock';

import { GenerateServiceCommand } from './generate-service';

describe('Generate Service command', () => {

    it('generates services', async () => {
        // Arrange
        FileMock.stub('package.json', '@aerogel/core');

        // Act
        await GenerateServiceCommand.run('FooBar');

        // Assert
        FileMock.expectCreated('src/services/FooBar.ts').toContain('class FooBarService extends Service');
        FileMock.expectCreated('src/services/FooBar.ts').toContain('export default facade(FooBarService);');
    });

});

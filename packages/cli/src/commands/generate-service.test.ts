import { beforeEach, describe, it } from 'vitest';

import FileMock from '@/lib/File.mock';
import { stubCommandRunner } from '@/testing/utils';
import type { StubCommandRunner } from '@/testing/utils';

import { GenerateServiceCommand } from './generate-service';

describe('Generate Service command', () => {

    let run: StubCommandRunner<typeof GenerateServiceCommand>;

    beforeEach(() => {
        run = stubCommandRunner(GenerateServiceCommand);
    });

    it('generates services', async () => {
        // Arrange
        FileMock.stub('package.json', '@aerogel/core');

        // Act
        await run('FooBar');

        // Assert
        FileMock.expectCreated('src/services/FooBar.ts').toContain('class FooBarService extends Service');
        FileMock.expectCreated('src/services/FooBar.ts').toContain('export default facade(new FooBarService());');
    });

});

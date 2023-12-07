import { beforeEach, describe, it } from 'vitest';
import { formatCodeBlock } from '@noeldemartin/utils';

import FileMock from '@/lib/File.mock';
import { stubCommandRunner } from '@/testing/utils';
import type { StubCommandRunner } from '@/testing/utils';

import { GenerateModelCommand } from './generate-model';

describe('Generate Model command', () => {

    let run: StubCommandRunner<typeof GenerateModelCommand>;

    beforeEach(() => {
        run = stubCommandRunner(GenerateModelCommand);
    });

    it('generates models', async () => {
        // Arrange
        FileMock.stub(
            'package.json',
            `
            "dependencies": {
                "@aerogel/core": "next",
                "soukai": "next"
            }
        `,
        );

        // Act
        await run('FooBar', {
            fields: 'name:string:required,age:number,birth:Date',
        });

        // Assert
        FileMock.expectCreated('src/models/FooBar.ts').toContain('import Model from \'./FooBar.schema\'');
        FileMock.expectCreated('src/models/FooBar.schema.ts').toContain(
            formatCodeBlock(`
                defineModelSchema({
                    fields: {
                        name: {
                            type: FieldType.String,
                            required: true,
                        },
                        age: FieldType.Number,
                        birth: FieldType.Date,
                    },
                })
            `),
        );
    });

});

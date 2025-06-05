import { describe, it } from 'vitest';
import { formatCodeBlock } from '@noeldemartin/utils';

import FileMock from '@aerogel/cli/lib/File.mock';

import { GenerateModelCommand } from './generate-model';

describe('Generate Model command', () => {

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
        await GenerateModelCommand.run('FooBar', {
            fields: 'name:string:required,age:number,birth:Date',
        });

        // Assert
        FileMock.expectCreated('src/models/FooBar.ts').toContain('import Model from \'./FooBar.schema\'');
        FileMock.expectCreated('src/models/FooBar.schema.ts').toContain(
            formatCodeBlock(`
                defineSolidModelSchema({
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

import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfsClass: 'schema:Action',
    fields: {
        name: {
            type: FieldType.String,
            required: true,
        },
    },
});

import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    rdfsClass: 'Action',
    history: true,
    tombstone: false,
    fields: {
        name: FieldType.String,
    },
});

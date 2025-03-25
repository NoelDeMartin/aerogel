import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'https://schema.org/',
    history: true,
    tombstone: false,
    fields: {
        name: FieldType.String,
        releaseDate: {
            type: FieldType.Date,
            rdfProperty: 'schema:datePublished',
        },
    },
});

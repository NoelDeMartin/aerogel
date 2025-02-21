import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    rdfContext: 'http://www.w3.org/2002/12/cal/ical#',
    rdfsClass: 'Vtodo',
    history: true,
    tombstone: false,
    fields: {
        name: {
            type: FieldType.String,
            rdfProperty: 'summary',
        },
    },
});

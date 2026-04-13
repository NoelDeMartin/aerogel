import { z } from 'zod';
import { defineSchema } from 'soukai-bis';

export default defineSchema({
    rdfContext: 'http://www.w3.org/2002/12/cal/ical#',
    rdfClass: 'Vtodo',
    history: true,
    fields: {
        name: z.string().rdfProperty('summary'),
    },
});

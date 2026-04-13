import { z } from 'zod';
import { defineSchema } from 'soukai-bis';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Action',
    fields: {
        name: z.string(),
    },
});

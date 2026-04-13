import { z } from 'zod';
import { defineSchema } from 'soukai-bis';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Action',
    history: true,
    fields: {
        name: z.string(),
    },
});

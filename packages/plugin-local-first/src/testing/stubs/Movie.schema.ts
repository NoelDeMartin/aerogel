import { z } from 'zod';
import { defineSchema } from 'soukai-bis';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    history: true,
    fields: {
        name: z.string(),
        releaseDate: z.date().rdfProperty('datePublished'),
    },
});

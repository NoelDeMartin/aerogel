import { defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Comment',
    history: true,
    fields: {
        about: z.url(),
        text: z.string(),
    },
});

import { belongsToOne, defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Chapter',
    fields: {
        name: z.string(),
        bookUrl: z.url().optional(),
    },
    relations: {
        book: belongsToOne('Book', 'bookUrl'),
    },
});

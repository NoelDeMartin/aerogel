import { belongsToOne, defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Thing',
    fields: {
        name: z.string(),
        shelfUrl: z.url().optional(),
    },
    relations: {
        shelf: belongsToOne('Shelf', 'shelfUrl'),
    },
});

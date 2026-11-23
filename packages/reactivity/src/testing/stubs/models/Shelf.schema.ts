import { defineSchema, hasMany } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Collection',
    fields: {
        name: z.string(),
    },
    relations: {
        items: hasMany('Item', 'shelfUrl'),
    },
});

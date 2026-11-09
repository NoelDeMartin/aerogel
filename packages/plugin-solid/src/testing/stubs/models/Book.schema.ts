import { defineSchema, hasMany } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Book',
    fields: {
        title: z.string(),
    },
    relations: {
        chapters: hasMany('Chapter', 'bookUrl'),
    },
});

import { defineSchema, hasMany } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Action',
    history: true,
    fields: {
        name: z.string(),
    },
    relations: {
        comments: hasMany('LocalTaskComment', 'about').usingSameDocument().onDelete('cascade'),
    },
});

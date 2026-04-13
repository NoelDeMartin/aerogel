import { z } from 'zod';
import { belongsToOne, defineSchema } from 'soukai-bis';

import Person from './Person';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    rdfClass: 'Article',
    timestamps: false,
    fields: {
        title: z.string().rdfProperty('name'),
        authorUrl: z.url().rdfProperty('author'),
    },
    relations: {
        author: belongsToOne(Person, 'authorUrl'),
    },
});

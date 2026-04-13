import { z } from 'zod';
import { defineSchema, hasMany } from 'soukai-bis';

import Post from './Post';

export default defineSchema({
    rdfContext: 'https://schema.org/',
    timestamps: false,
    fields: {
        name: z.string(),
    },
    relations: {
        posts: hasMany(() => Post, 'authorUrl'),
    },
});

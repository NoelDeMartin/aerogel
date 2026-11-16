import { belongsToMany, defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    fields: {
        chapterUrls: z.array(z.string()).default([]),
    },
    relations: {
        chapters: belongsToMany('Chapter', 'chapterUrls'),
    },
});

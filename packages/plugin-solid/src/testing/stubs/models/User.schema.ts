import { z } from 'zod';
import { defineSchema } from 'soukai-bis';

export default defineSchema({
    fields: {
        name: z.string(),
        age: z.number(),
    },
});

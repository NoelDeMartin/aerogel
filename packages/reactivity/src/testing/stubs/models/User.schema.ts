import { defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    fields: {
        name: z.string(),
        age: z.number(),
    },
});

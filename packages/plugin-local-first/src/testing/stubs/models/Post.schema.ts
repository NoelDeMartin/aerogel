import { defineSchema } from 'soukai-bis';
import { z } from 'zod';

export default defineSchema({
    fields: {
        title: z.string(),
    },
});

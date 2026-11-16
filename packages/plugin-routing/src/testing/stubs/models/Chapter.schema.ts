import { defineSchema, hasOne } from 'soukai-bis';

export default defineSchema({
    fields: {},
    relations: {
        book: hasOne('Book', 'chapterUrls'),
    },
});

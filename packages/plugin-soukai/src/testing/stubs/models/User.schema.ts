import { FieldType, defineModelSchema } from 'soukai';

export default defineModelSchema({
    fields: {
        name: FieldType.String,
        age: FieldType.Number,
    },
});

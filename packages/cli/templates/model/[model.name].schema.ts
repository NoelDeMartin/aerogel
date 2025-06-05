import { FieldType } from 'soukai';
import { defineSolidModelSchema } from 'soukai-solid';

export default defineSolidModelSchema({
    fields: {
<% &model.fieldsDefinition %>
    },
});

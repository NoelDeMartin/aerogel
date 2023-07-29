import { <% soukaiImports %> } from 'soukai';

export default defineModelSchema({
    fields: {
<% &model.fieldsDefinition %>
    },
});

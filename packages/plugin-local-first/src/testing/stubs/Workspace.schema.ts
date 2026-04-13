import { contains, defineSchema } from 'soukai-bis';

import TasksList from './TasksList';

export default defineSchema(TasksList, {
    relations: {
        lists: contains(TasksList),
    },
});

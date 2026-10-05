import { contains, defineContainerSchema } from 'soukai-bis';

import Post from './Post';

export default defineContainerSchema({
    relations: {
        posts: contains(() => Post),
    },
});

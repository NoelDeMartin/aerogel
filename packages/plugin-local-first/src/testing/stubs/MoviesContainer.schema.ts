import { contains, defineContainerSchema } from 'soukai-bis';

import Movie from './Movie';

export default defineContainerSchema({
    history: true,
    timestamps: true,
    tombstone: false,
    relations: {
        movies: contains(Movie),
    },
});

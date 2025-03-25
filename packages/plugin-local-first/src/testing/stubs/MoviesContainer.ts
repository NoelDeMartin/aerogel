import { SolidContainer } from 'soukai-solid';
import type { Relation } from 'soukai';
import type { SolidContainsRelation } from 'soukai-solid';

import Movie from './Movie';

export default class MoviesContainer extends SolidContainer {

    public static override history = true;
    public static override timestamps = true;
    public static override tombstone = false;

    declare public movies?: Movie[];
    declare public relatedMovies: SolidContainsRelation<this, Movie, typeof Movie>;

    public moviesRelationship(): Relation {
        return this.contains(Movie);
    }

}

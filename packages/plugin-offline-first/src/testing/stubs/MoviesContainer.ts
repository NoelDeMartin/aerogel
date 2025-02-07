import { SolidContainer } from 'soukai-solid';
import type { Relation } from 'soukai';
import type { SolidContainsRelation } from 'soukai-solid';

import Movie from './Movie';

export default class MoviesContainer extends SolidContainer {

    public static history = true;
    public static timestamps = true;
    public static tombstone = false;

    public declare movies?: Movie[];
    public declare relatedMovies: SolidContainsRelation<this, Movie, typeof Movie>;

    public moviesRelationship(): Relation {
        return this.contains(Movie);
    }

}

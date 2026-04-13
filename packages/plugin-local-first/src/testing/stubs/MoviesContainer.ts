import type { ContainsRelation } from 'soukai-bis';

import Model from './MoviesContainer.schema';
import type Movie from './Movie';

export default class MoviesContainer extends Model {

    declare public movies?: Movie[];
    declare public relatedMovies: ContainsRelation<this, Movie, typeof Movie>;

}

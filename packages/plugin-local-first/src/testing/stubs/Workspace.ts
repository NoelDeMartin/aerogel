import type { ContainsRelation } from 'soukai-bis';

import Model from './Workspace.schema';
import type TasksList from './TasksList';

export default class Workspace extends Model {

    declare public lists?: TasksList[];
    declare public relatedLists: ContainsRelation<this, TasksList, typeof TasksList>;

}

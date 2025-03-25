import type { Relation } from 'soukai';
import type { SolidContainsRelation } from 'soukai-solid';

import TasksList from './TasksList';

export default class Workspace extends TasksList {

    declare public lists?: TasksList[];
    declare public relatedLists: SolidContainsRelation<this, TasksList, typeof TasksList>;

    public listsRelationship(): Relation {
        return this.contains(TasksList);
    }

}

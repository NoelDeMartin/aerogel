import { SolidContainer } from 'soukai-solid';
import type { Relation } from 'soukai';
import type { SolidContainsRelation } from 'soukai-solid';

import Task from './Task';

export default class TasksList extends SolidContainer {

    public static history = true;
    public static timestamps = true;
    public static tombstone = false;

    public declare tasks?: Task[];
    public declare relatedTasks: SolidContainsRelation<this, Task, typeof Task>;

    public tasksRelationship(): Relation {
        return this.contains(Task);
    }

}

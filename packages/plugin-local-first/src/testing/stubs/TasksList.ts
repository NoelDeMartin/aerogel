import { SolidContainer } from 'soukai-solid';
import type { Relation } from 'soukai';
import type { SolidContainsRelation } from 'soukai-solid';

import Task from './Task';

export default class TasksList extends SolidContainer {

    public static override history = true;
    public static override timestamps = true;
    public static override tombstone = false;

    declare public tasks?: Task[];
    declare public relatedTasks: SolidContainsRelation<this, Task, typeof Task>;

    public tasksRelationship(): Relation {
        return this.contains(Task);
    }

}

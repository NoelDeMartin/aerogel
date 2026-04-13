import type { ContainsRelation } from 'soukai-bis';

import Model from './TasksList.schema';
import type Task from './Task';

export default class TasksList extends Model {

    declare public tasks?: Task[];
    declare public relatedTasks: ContainsRelation<this, Task, typeof Task>;

}

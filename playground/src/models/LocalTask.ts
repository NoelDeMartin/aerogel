import Model from './LocalTask.schema';
import type ITask from './Task';

export default class LocalTask extends Model implements ITask {

    public static override cloud = { path: '/tasks/' };

}

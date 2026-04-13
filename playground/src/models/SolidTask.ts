import Model from './SolidTask.schema';
import type ITask from './Task';

export default class SolidTask extends Model implements ITask {

    public static override cloud = false;

}

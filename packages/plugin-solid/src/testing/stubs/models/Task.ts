import Model from './Task.schema';

export default class Task extends Model {
    public isSoftDeleted(): boolean {
        return !!this.done;
    }
}

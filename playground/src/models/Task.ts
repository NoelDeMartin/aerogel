import type ITask from '@/models/ITask';

import Model from './Task.schema';

export default class Task extends Model implements ITask {}

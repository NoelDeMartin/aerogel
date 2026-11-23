import type { Model, ModelConstructor, ModelInstanceEvent, ModelListener } from 'soukai-bis';
import { getCurrentScope, onScopeDispose } from 'vue';

export function useModelEvent<TModel extends Model, TEvent extends ModelInstanceEvent>(
    modelClass: ModelConstructor<TModel>,
    event: TEvent,
    listener: ModelListener<TModel, TEvent>,
): void {
    const cleanUp = modelClass.on(event, listener);

    getCurrentScope() && onScopeDispose(cleanUp);
}

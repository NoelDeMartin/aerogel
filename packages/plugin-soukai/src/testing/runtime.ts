import { requireBootedModel } from 'soukai';
import type { ModelConstructor, ModelsRegistry } from 'soukai';

export function model<T extends keyof ModelsRegistry>(name: T): ModelsRegistry[T];
export function model<T extends ModelConstructor = ModelConstructor>(name: string): T;
export function model(name: string): ModelConstructor {
    return requireBootedModel(name);
}

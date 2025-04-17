import { Solid } from '@aerogel/plugin-solid';
import type { SolidTypeIndex } from 'soukai-solid';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';

const typeIndexes: WeakMap<SolidUserProfile, SolidTypeIndex | null> = new WeakMap();

export default class LoadsTypeIndex {

    protected async loadTypeIndex(options?: { create?: false; fresh?: boolean }): Promise<SolidTypeIndex | null>;
    protected async loadTypeIndex(options?: { create?: true; fresh?: boolean }): Promise<SolidTypeIndex>;
    protected async loadTypeIndex(options: { create?: boolean; fresh?: boolean } = {}): Promise<SolidTypeIndex | null> {
        const user = Solid.requireUser();

        if (options.fresh || !typeIndexes.has(user)) {
            typeIndexes.set(user, await Solid.findPrivateTypeIndex({ fresh: options.fresh }));
        }

        if (options.create && !typeIndexes.get(user)) {
            typeIndexes.set(user, await Solid.findOrCreatePrivateTypeIndex());
        }

        return typeIndexes.get(user) ?? null;
    }

}

import { Solid } from '@aerogel/plugin-solid';
import type { SolidTypeIndex } from 'soukai-solid';
import type { SolidUserProfile } from '@noeldemartin/solid-utils';

const typeIndexes: WeakMap<SolidUserProfile, SolidTypeIndex | null> = new WeakMap();

export default class LoadsTypeIndex {

    protected async loadTypeIndex(options: { create: true }): Promise<SolidTypeIndex>;
    protected async loadTypeIndex(options?: { create: false }): Promise<SolidTypeIndex | null>;
    protected async loadTypeIndex(options: { create?: boolean } = {}): Promise<SolidTypeIndex | null> {
        const user = Solid.requireUser();

        if (options.create && !typeIndexes.get(user)) {
            typeIndexes.set(user, await Solid.findOrCreatePrivateTypeIndex());
        } else if (!typeIndexes.has(user)) {
            typeIndexes.set(user, await Solid.findPrivateTypeIndex());
        }

        return typeIndexes.get(user) ?? null;
    }

}

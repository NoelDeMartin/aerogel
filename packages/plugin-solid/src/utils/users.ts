import type { SolidUserProfile } from '@noeldemartin/solid-utils';

export function userDisplayName(user: SolidUserProfile): string {
    return user.name ?? user.webId;
}

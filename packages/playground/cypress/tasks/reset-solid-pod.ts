import { cssResetPOD } from '../support/community-solid-server';

export default async function(): Promise<null> {
    await cssResetPOD();

    return null;
}

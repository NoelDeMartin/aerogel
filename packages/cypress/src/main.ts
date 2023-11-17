import { addMatchImageSnapshotCommand } from '@simonsmith/cypress-image-snapshot/command';
import { installChaiPlugin } from '@noeldemartin/solid-utils';

import installCustomCommands from '@/support/commands';
import installCustomQueries from '@/support/queries';

export * from '@/support/commands';
export * from '@/support/queries';
export * from '@/support/solid';

export default function install(): void {
    addMatchImageSnapshotCommand();
    installCustomCommands();
    installCustomQueries();
    installChaiPlugin();
}

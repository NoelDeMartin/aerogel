import installCustomCommands from '@/support/commands';
import installCustomQueries from '@/support/queries';

export * from '@/support/commands';
export * from '@/support/queries';

export default function install(): void {
    installCustomCommands();
    installCustomQueries();
}

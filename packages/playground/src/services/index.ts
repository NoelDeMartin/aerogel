import OfflineTasks from './OfflineTasks';
import SolidTasks from './SolidTasks';
import Startup from './Startup';

export const services = {
    $offlineTasks: OfflineTasks,
    $solidTasks: SolidTasks,
    $startup: Startup,
};

export type AppServices = typeof services;

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends AppServices {}
}

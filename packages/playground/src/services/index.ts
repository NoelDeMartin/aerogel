import OfflineTasks from './OfflineTasks';
import SolidTasks from './SolidTasks';

export const services = {
    $offlineTasks: OfflineTasks,
    $solidTasks: SolidTasks,
};

export type AppServices = typeof services;

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends AppServices {}
}

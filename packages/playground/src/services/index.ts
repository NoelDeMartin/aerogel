import SolidTasks from './SolidTasks';

export const services = { $solidTasks: SolidTasks };

export type AppServices = typeof services;

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties extends AppServices {}
}

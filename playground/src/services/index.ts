import LocalTasks from './LocalTasks';
import SolidTasks from './SolidTasks';
import Startup from './Startup';

export const services = {
    $localTasks: LocalTasks,
    $solidTasks: SolidTasks,
    $startup: Startup,
};

export type AppServices = typeof services;

declare module '@aerogel/core' {
    interface Services extends AppServices {}
}

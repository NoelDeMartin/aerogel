import Solid from './Solid';

export * from './Solid';
export { Solid };

export const services = { $solid: Solid };

export type SolidServices = typeof services;

declare module '@aerogel/core' {
    interface Services extends SolidServices {}
}

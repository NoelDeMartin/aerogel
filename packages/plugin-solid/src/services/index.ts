import Solid from './Solid';

export * from './Solid';
export { Solid };

export const services = { $solid: Solid };

export type SolidServices = typeof services;

declare module '@aerogel/core' {
    // Type-checking the monorepo sees this both from source and from built types, causing a TS2320 conflict.
    // @ts-ignore
    interface Services extends SolidServices {}
}

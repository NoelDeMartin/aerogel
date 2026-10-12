import Solid from './Solid';
import SolidFake from './Solid.fake';

export * from './Solid';
export * from './Solid.fake';
export { Solid, SolidFake };

export const services = { $solid: Solid };

export type SolidServices = typeof services;

declare module '@aerogel/core' {
    // Type-checking the monorepo sees this both from source and from built types, causing a TS2320 conflict.
    // @ts-ignore
    interface Services extends SolidServices {}
}

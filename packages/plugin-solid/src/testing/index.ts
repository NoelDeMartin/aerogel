import * as testingRuntime from './runtime';

export { default as FakeSolidEngine } from './FakeSolidEngine';
export { testingRuntime };

export type SolidTestingRuntime = typeof testingRuntime;

declare module '@aerogel/core' {
    export interface AerogelTestingRuntime extends SolidTestingRuntime {}
}

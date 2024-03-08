import * as testingRuntime from './runtime';

export { testingRuntime };

export type SoukaiTestingRuntime = typeof testingRuntime;

declare module '@aerogel/core' {
    export interface AerogelTestingRuntime extends SoukaiTestingRuntime {}
}

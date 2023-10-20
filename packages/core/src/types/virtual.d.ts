declare module 'virtual:aerogel' {
    interface AerogelBuild {
        environment: 'production' | 'development' | 'testing';
        basePath?: string;
        sourceUrl?: string;
    }

    const build: AerogelBuild;

    export default build;
}

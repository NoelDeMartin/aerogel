interface Navigator {
    wakeLock: { request(type?: 'screen'): Promise<{ release(): Promise<void> }> };
}

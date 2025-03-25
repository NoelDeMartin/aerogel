import { execSync } from 'node:child_process';

export function getSourceHash(): string {
    try {
        return execSync('git rev-parse HEAD').toString();
    } catch (e) {
        return '?';
    }
}

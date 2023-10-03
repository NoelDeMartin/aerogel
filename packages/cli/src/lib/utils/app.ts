import App from '@/lib/App';
import File from '@/lib/File';

export function app(): App {
    // TODO parse app name
    return new App('');
}

export function isLocalApp(): boolean {
    return File.contains('package.json', 'file');
}

export function isLinkedLocalApp(): boolean {
    return File.isSymlink('node_modules/@aerogel/core');
}

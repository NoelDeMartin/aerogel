import App from '@aerogel/cli/lib/App';
import File from '@aerogel/cli/lib/File';

export function app(): App {
    // TODO parse app name
    return new App('');
}

export function isLocalApp(): boolean {
    return File.contains('package.json', '"@aerogel/core": "file:');
}

export function isLinkedLocalApp(): boolean {
    return isLocalApp() && !/"@aerogel\/core": "file:[^"]*\.tgz"/.test(File.read('package.json') ?? '');
}

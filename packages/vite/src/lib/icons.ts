import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { md5 } from '@noeldemartin/utils';
import type { Connect } from 'vite';
import type { IconResource } from 'vite-plugin-pwa';
import type { PluginContext } from 'rollup';

import type { AppInfo } from '@aerogel/vite/lib/options';

const ICON_BACKGROUND = '#ffffff';
const CACHE_DIRECTORY = 'aerogel-icons';

const generatedIcons: Record<string, Promise<Record<string, Buffer>>> = {};

interface IconDefinition {
    fileName: string;
    size: number;
    format: 'svg' | 'png' | 'ico';
    scale?: number;
    background?: string;
    manifest?: Pick<IconResource, 'purpose'>;
}

export const ICON_SOURCE_PATH = 'src/assets/icon.svg';

export const ICONS = {
    favicon: { fileName: 'favicon.ico', size: 48, format: 'ico' },
    faviconSVG: { fileName: 'favicon.svg', size: 0, format: 'svg' },
    faviconPNG: { fileName: 'favicon-96x96.png', size: 96, format: 'png' },
    appleTouch: {
        fileName: 'apple-touch-icon-180x180.png',
        size: 180,
        format: 'png',
        scale: 0.8,
        background: ICON_BACKGROUND,
    },
    pwa64: { fileName: 'pwa-64x64.png', size: 64, format: 'png', manifest: {} },
    pwa192: { fileName: 'pwa-192x192.png', size: 192, format: 'png', manifest: {} },
    pwa512: { fileName: 'pwa-512x512.png', size: 512, format: 'png', manifest: { purpose: 'any' } },
    maskable: {
        fileName: 'maskable-icon-512x512.png',
        size: 512,
        format: 'png',
        scale: 0.6,
        background: ICON_BACKGROUND,
        manifest: { purpose: 'maskable' },
    },
} as const satisfies Record<string, IconDefinition>;

const ICON_DEFINITIONS: IconDefinition[] = Object.values(ICONS);
const ICO_SIZES = [16, 32, 48];

async function renderPNG(source: Buffer, definition: IconDefinition, size: number = definition.size): Promise<Buffer> {
    const { default: sharp } = await import('sharp');
    const contentSize = Math.round(size * (definition.scale ?? 1));
    const { width, height } = await sharp(source).metadata();
    const density = Math.max(
        1,
        Math.min(100000, (72 * contentSize) / Math.max(width ?? contentSize, height ?? contentSize, 1)),
    );
    const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
    const content = await sharp(source, { density })
        .resize(contentSize, contentSize, { fit: 'contain', background: transparent })
        .png()
        .toBuffer();

    if (!definition.background && contentSize === size) {
        return content;
    }

    return sharp({
        create: { width: size, height: size, channels: 4, background: definition.background ?? transparent },
    })
        .composite([{ input: content, gravity: 'center' }])
        .png()
        .toBuffer();
}

async function renderICO(source: Buffer, definition: IconDefinition): Promise<Buffer> {
    const images = await Promise.all(ICO_SIZES.map((size) => renderPNG(source, definition, size)));
    const header = Buffer.alloc(6 + 16 * images.length);
    let offset = header.length;

    header.writeUInt16LE(0, 0);
    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(images.length, 4);

    images.forEach((image, index) => {
        const entry = 6 + 16 * index;
        const size = ICO_SIZES[index] ?? 0;

        header.writeUInt8(size >= 256 ? 0 : size, entry);
        header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
        header.writeUInt8(0, entry + 2);
        header.writeUInt8(0, entry + 3);
        header.writeUInt16LE(1, entry + 4);
        header.writeUInt16LE(32, entry + 6);
        header.writeUInt32LE(image.length, entry + 8);
        header.writeUInt32LE(offset, entry + 12);

        offset += image.length;
    });

    return Buffer.concat([header, ...images]);
}

async function renderIcon(source: Buffer, definition: IconDefinition): Promise<Buffer> {
    switch (definition.format) {
        case 'svg':
            return source;
        case 'ico':
            return renderICO(source, definition);
        case 'png':
            return renderPNG(source, definition);
    }
}

async function renderIcons(
    baseIconPath: string,
    cacheDir: string,
    source: Buffer = readFileSync(baseIconPath),
): Promise<Record<string, Buffer>> {
    const cacheDirectory = resolve(cacheDir, CACHE_DIRECTORY, md5(source.toString('base64') + JSON.stringify(ICONS)));
    const icons: Record<string, Buffer> = {};

    for (const definition of ICON_DEFINITIONS) {
        const cachePath = resolve(cacheDirectory, definition.fileName);

        if (existsSync(cachePath)) {
            icons[definition.fileName] = readFileSync(cachePath);

            continue;
        }

        const icon = await renderIcon(source, definition);

        mkdirSync(cacheDirectory, { recursive: true });
        writeFileSync(cachePath, icon);

        icons[definition.fileName] = icon;
    }

    return icons;
}

function generateIcons(app: AppInfo): Promise<Record<string, Buffer>> | null {
    const baseIconPath = app.baseIconPath;

    if (!baseIconPath) {
        return null;
    }

    const source = readFileSync(baseIconPath);
    const hash = md5(source.toString('base64'));

    return (generatedIcons[hash] ??= renderIcons(baseIconPath, app.cacheDir, source).catch((error) => {
        delete generatedIcons[hash];

        throw error;
    }));
}

export function resolveIconSource(app: AppInfo, root: string): void {
    const iconPath = resolve(root, ICON_SOURCE_PATH);

    if (!existsSync(iconPath)) {
        // eslint-disable-next-line no-console
        console.warn(
            `It was not possible to generate the app icons because \`${ICON_SOURCE_PATH}\` is missing, ` +
                'to remove this warning add an svg icon in that path or disable the `generateIcons` option ' +
                'in the Aerogel vite plugin options.',
        );

        return;
    }

    app.baseIconPath = iconPath;
}

export function getManifestIcons(): IconResource[] {
    return ICON_DEFINITIONS.filter((definition) => definition.manifest).map((definition) => ({
        src: definition.fileName,
        sizes: `${definition.size}x${definition.size}`,
        type: 'image/png',
        ...definition.manifest,
    }));
}

export async function generateIconAssets(context: PluginContext, app: AppInfo): Promise<void> {
    const icons = await generateIcons(app);

    if (!icons) {
        return;
    }

    for (const [fileName, source] of Object.entries(icons)) {
        context.emitFile({ type: 'asset', fileName, source });

        app.additionalManifestEntries.push({
            url: fileName,
            revision: md5(source.toString('base64')),
        });
    }
}

export function iconsMiddleware(app: AppInfo): Connect.NextHandleFunction {
    const mediaTypes = { svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon' };

    return (request, response, next) => {
        const path = request.url?.split('?')[0];
        const definition = path && ICON_DEFINITIONS.find(({ fileName }) => path.endsWith(`/${fileName}`));
        const icons = definition && generateIcons(app);

        if (!definition || !icons) {
            next();

            return;
        }

        icons
            .then((generated) => {
                response.statusCode = 200;
                response.setHeader('Content-Type', mediaTypes[definition.format]);
                response.end(generated[definition.fileName]);
            })
            .catch(next);
    };
}

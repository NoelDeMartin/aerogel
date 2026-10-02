# Conventions

This repository follows my [project conventions](https://github.com/NoelDeMartin/scripts/blob/main/CONVENTIONS.md) with the exceptions:

## TypeScript 5.9

TypeScript is pinned to `~5.9.3` instead of 6. The Vue packages bundle their declarations with `vite-plugin-dts` (`rollupTypes`), which uses api-extractor, and api-extractor still ships TypeScript 5.9. With TypeScript 6, it generates empty declaration files.

For the same reason, `playwright`, `storybook` and the playground's `tsconfig.node.json` extend `@tsconfig/node24` instead of `@tsconfig/node26`: the Node 26 base targets `es2025`, which TypeScript 5.9 doesn't recognize. The runtime is still Node 26.

## Building Vue packages

`core` and the `plugin-*` packages are built with `vp build` (Vite library mode) instead of `vp pack`, because they need Vue SFC compilation and the Aerogel Vite plugin. As a consequence:

- Their declarations come from `vite-plugin-dts` (see above), and `core` runs `scripts/fix-types.sh` after building.
- `vp build` doesn't run publint and attw like `vp pack` does, so they have a `verify` script for that.
- Their plugins are wrapped in `lazyPlugins`, so that commands that only read the config (like `vp check`) don't instantiate them.

The other packages (`cli`, `vite`, `playwright` and `storybook`) use `vp pack`, and `create-aerogel` has nothing to build.

## Build order

`plugin-solid` and `plugin-local-first` depend on each other's types, and `vp run` refuses dependency cycles. So the root `build` script builds packages in stages, and `type-check` and `verify` run with `--parallel`.

The same cycle is why `plugin-solid` has a `@ts-ignore` on its `Services` augmentation: `vp check` type-checks the whole monorepo at once, and sees the augmentation both from source and from the built types.

## Docs

The VitePress 1 docs don't work with Vite 8, so `pnpm-workspace.yaml` overrides VitePress' Vite version (`'vitepress@1>vite'`).

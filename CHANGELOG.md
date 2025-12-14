# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.1.2](https://github.com/NoelDeMartin/aerogel/releases/tag/v0.1.2) - 2025-12-14

### Added

- `<Details>` component.
- `<Combobox>` component.
- `fullscreen` and `fullscreen-mobile` boolean props in modals.
- [eruda-indexeddb](https://github.com/NoelDeMartin/eruda-indexeddb) for debugging IndexedDB.

### Changed

- Internal syncing and caching mechanisms refactored (shouldn't have any breaking changes, but look out for unintended bugs).
- Modals refactored to follow the pattern from [@noeldemartin/vue-modals](https://github.com/NoelDeMartin/vue-modals/).

### Fixed

- [#6](https://github.com/NoelDeMartin/aerogel/issues/6) Cursor jumps in textareas.
- [#9](https://github.com/NoelDeMartin/aerogel/issues/9) Loading nested containers.
- Updated Inrupt auth library to `3.1.1` (authentication was failing with some providers such as `igrant.io`).
- Various form input bugs.

## [v0.1.1](https://github.com/NoelDeMartin/aerogel/releases/tag/v0.1.1) - 2025-06-08

### Added

- Detect network status changes in local-first services.

## [v0.1.0](https://github.com/NoelDeMartin/aerogel/releases/tag/v0.1.0) - 2025-05-30

First release! No documentation yet, but _it's coming_.

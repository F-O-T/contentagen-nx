# Changelog

All notable changes to this package will be documented in this file.

## [0.4.6] - 2025-08-13
### Changed
- Improved `listContentByAgent`: now supports advanced pagination (`limit` and `page`), status filtering (`draft`, `approved`, `generating`), and stricter input validation via Zod schemas.
- Returns a full content list response including post metadata, image URL, status, and total count.
- See README for updated usage and schema details.

## [0.4.1] - 2025-08-12
### Added
- Added new function `getContentBySlug` to the SDK. This function allows fetching a content item by its slug.


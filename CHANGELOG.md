# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Language support for LLMs output across API, Mastra, and workers
- Real GitHub repository statistics fetching and display on landing page
- Idea generation workflow with dedicated agent

### Changed
- Migrated documentation to static site using nginx and alpine image

## [0.1.0]

### Added
- Content version history: versions card, selectable version rows, and a details modal with line-by-line and inline diffs, changed-fields badges, and change stats.
- Diff viewer and a detailed version modal with clear empty/initial-version states.

### Improved
- Profile photo uploads now replace prior images and are compressed for faster loading.

### Backend
- Full content versioning: new version storage, version APIs, database schema updates, worker flow, and cache invalidation to surface versions in the dashboard.

### Chores
- Added initial CHANGELOG.md.

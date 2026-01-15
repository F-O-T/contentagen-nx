# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-15

### Added

- **Core Spell Checking**
  - `createSpellChecker()` factory function for creating spell checker instances
  - `check(word)` - Check if a word is spelled correctly
  - `suggest(word, limit?)` - Get spelling suggestions for misspelled words
  - `checkText(text)` - Check entire text and return errors with positions
  - `addWord(word)` - Add custom words to dictionary
  - `ignoreWord(word)` - Ignore a word during session

- **Streaming & Incremental APIs**
  - `checkTextStream(text)` - Async generator that yields errors in real-time
  - `checkTextIncremental(text, start, end)` - Only recheck changed text regions

- **Hunspell Format Support**
  - `parseAffFile(content)` - Parse Hunspell .aff affix rules
  - `parseDicFile(content)` - Parse Hunspell .dic word lists
  - Support for prefix and suffix rules with conditions
  - Support for REP (replacement) rules for common typos
  - Support for MAP (character similarity) rules

- **Browser Storage Module** (`@f-o-t/spelling/browser-storage`)
  - `createDictionaryStorage()` - Create storage instance for caching
  - `loadDictionary()` - Load with multi-tier caching fallback
  - `loadDictionaryFromCache()` - Load from cache only
  - `saveDictionaryToCache()` - Manually save to cache
  - `clearDictionaryCache()` - Clear cached data
  - Session storage tier (fastest, 30-min default TTL)
  - IndexedDB tier (persistent, 7-day default TTL)
  - Cache API tier (network file caching)

- **Pre-parsed Data Support**
  - Accept `parsedAffData` and `parsedDicData` in config
  - Skip parsing when using cached data (faster initialization)

- **Type Safety**
  - Full Zod schema validation for all inputs/outputs
  - TypeScript types exported for all interfaces
  - `spellCheckerConfigSchema` for config validation
  - `spellingErrorSchema` for error objects
  - `checkResultSchema` for check results

- **Performance Optimizations**
  - LRU cache for word checks (10,000 entries)
  - LRU cache for suggestions (1,000 entries)
  - Indexed suffix/prefix rules for O(1) lookup
  - Early termination in suggestion generation
  - Lazy edit-distance-2 generation

- **Utilities**
  - `extractWords(text)` - Extract words with positions
  - `createWordRegex()` - Create word-matching regex
  - `shouldIgnoreWord(word, options)` - Check if word should be skipped
  - `WORD_PATTERN` - Unicode word pattern constant

### Architecture

- Fully functional approach (no classes, pure functions with closures)
- Factory functions: `createCache`, `createDictionary`, `createSuggester`
- All internal state managed via closures
- Backward compatible public API

### Performance Benchmarks

| Metric | Result |
|--------|--------|
| Dictionary load | ~250ms |
| Single word check | 0.002ms |
| Cache hit rate | 100% |
| Suggestions (8) | ~120ms |
| Text check (1000 words) | ~3500ms |
| Incremental check | <2ms |

### Dependencies

- `zod` ^3.24.1 - Schema validation

### Supported Languages

- Portuguese (pt) - 312,368 words
- Any Hunspell-compatible dictionary

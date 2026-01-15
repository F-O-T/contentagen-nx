# @f-o-t/spelling

A Hunspell-compatible spell checking library with Zod schemas for TypeScript. Designed for high performance with browser caching support.

## Features

- **Hunspell Compatible** - Supports standard `.aff` and `.dic` dictionary files
- **Type Safe** - Full Zod schema validation with TypeScript types
- **Functional Architecture** - Pure functions with closures (no classes)
- **High Performance** - LRU caching, indexed affix rules, early termination
- **Browser Caching** - Multi-tier storage (Session, IndexedDB, Cache API)
- **Streaming API** - Real-time error detection for editors
- **Incremental Checking** - Only recheck changed text regions

## Installation

```bash
bun add @f-o-t/spelling
# or
npm install @f-o-t/spelling
```

## Quick Start

```typescript
import { createSpellChecker } from "@f-o-t/spelling";

// Load dictionary files (e.g., via fetch)
const affData = await fetch("/dictionaries/pt/pt.aff").then(r => r.text());
const dicData = await fetch("/dictionaries/pt/pt.dic").then(r => r.text());

// Create spell checker
const checker = createSpellChecker({
  language: "pt",
  affData,
  dicData,
  ignoreCapitalized: true,
  minWordLength: 3,
  maxSuggestions: 8,
});

// Check a word
checker.check("palavra");     // true
checker.check("palavrra");    // false

// Get suggestions
checker.suggest("palavrra");  // ["palavra", ...]

// Check entire text
const result = checker.checkText("Esta é uma palavrra errada");
console.log(result.errors);   // [{ word: "palavrra", offset: 12, ... }]
```

## Browser Caching (Recommended)

For web applications, use the browser storage module for significantly faster load times:

```typescript
import { createSpellChecker } from "@f-o-t/spelling";
import {
  createDictionaryStorage,
  loadDictionary
} from "@f-o-t/spelling/browser-storage";

// Create storage instance
const storage = createDictionaryStorage({
  keyPrefix: "myapp-spelling",
  sessionTTL: 60 * 60 * 1000,        // 1 hour
  indexedDBTTL: 30 * 24 * 60 * 60 * 1000, // 30 days
});

// Load with multi-tier caching
// Checks: Session Storage → IndexedDB → Cache API → Network
const data = await loadDictionary(
  "pt",
  "/dictionaries/pt/pt.aff",
  "/dictionaries/pt/pt.dic",
  storage
);

// Create checker with pre-parsed data (skips parsing!)
const checker = createSpellChecker({
  language: "pt",
  parsedAffData: data.affData,
  parsedDicData: data.dicData,
});
```

**Performance:**
- First load: ~500ms (network + parse)
- Cached loads: <50ms (from session storage)

## API Reference

### Main Entry (`@f-o-t/spelling`)

#### `createSpellChecker(config)`

Creates a spell checker instance.

```typescript
interface SpellCheckerConfig {
  language: string;
  // Option A: Raw data (will be parsed)
  affData?: string;
  dicData?: string;
  // Option B: Pre-parsed data (faster)
  parsedAffData?: ParsedAffData;
  parsedDicData?: ParsedDicData;
  // Options
  customWords?: string[];
  ignoreList?: string[];
  ignoreCapitalized?: boolean;  // default: true
  minWordLength?: number;        // default: 3
  maxSuggestions?: number;       // default: 8
}
```

#### `SpellChecker` Interface

```typescript
interface SpellChecker {
  // Core methods
  check(word: string): boolean;
  suggest(word: string, limit?: number): string[];
  checkText(text: string): CheckResult;

  // Streaming for real-time UI
  checkTextStream(text: string): AsyncGenerator<SpellingError>;

  // Incremental for editors
  checkTextIncremental(text: string, changeStart: number, changeEnd: number): CheckResult;

  // Dictionary management
  addWord(word: string): void;
  ignoreWord(word: string): void;
  clearCache(): void;

  // Properties
  readonly isReady: boolean;
  readonly dictionarySize: number;
  readonly cacheStats: CacheStats;
}
```

#### Utility Functions

```typescript
// Word extraction
extractWords(text: string): Array<{ word: string; offset: number }>;
createWordRegex(): RegExp;

// Hunspell parsing
parseAffFile(content: string): ParsedAffData;
parseDicFile(content: string): ParsedDicData;

// Word filtering
shouldIgnoreWord(word: string, options: IgnoreOptions): boolean;
```

### Browser Storage (`@f-o-t/spelling/browser-storage`)

#### `createDictionaryStorage(options?)`

Creates a storage instance for dictionary caching.

```typescript
interface DictionaryStorageOptions {
  keyPrefix?: string;     // default: "spelling"
  sessionTTL?: number;    // default: 30 minutes
  indexedDBTTL?: number;  // default: 7 days
  cacheName?: string;     // default: "spelling-dictionaries"
}
```

#### `loadDictionary(language, affUrl, dicUrl, storage?)`

Loads dictionary with multi-tier caching fallback.

```typescript
// Caching order: Session → IndexedDB → Cache API → Network
const data = await loadDictionary("pt", "/pt.aff", "/pt.dic");
```

#### `loadDictionaryFromCache(language, storage?)`

Loads from cache only (no network fetch).

```typescript
const cached = await loadDictionaryFromCache("pt");
if (cached) {
  // Use cached data
} else {
  // Need to fetch from network
}
```

#### `saveDictionaryToCache(data, storage?)`

Manually save dictionary data to cache.

#### `clearDictionaryCache(language?, storage?)`

Clear cached dictionary data.

## Streaming API

For real-time editors, use the streaming API to get errors as they're found:

```typescript
for await (const error of checker.checkTextStream(text)) {
  // Render error immediately without waiting for full scan
  highlightError(error);
}
```

## Incremental Checking

For editors with frequent updates, only recheck the changed region:

```typescript
// User edited characters 50-60
const result = checker.checkTextIncremental(text, 50, 60);
// Only words near the change are rechecked
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ignoreCapitalized` | boolean | `true` | Skip words starting with uppercase |
| `minWordLength` | number | `3` | Minimum word length to check |
| `maxSuggestions` | number | `8` | Maximum suggestions per word |
| `customWords` | string[] | `[]` | Additional words to accept |
| `ignoreList` | string[] | `[]` | Words to skip during checking |

## Performance

Benchmark results (Portuguese dictionary, 312k words):

| Operation | Time |
|-----------|------|
| Dictionary load | ~250ms |
| Single word check | 0.002ms |
| Suggestions (8) | ~120ms |
| Text check (1000 words) | ~3500ms |
| Cache hit rate | 100% |

### Optimization Tips

1. **Use browser caching** - Reduces load time from ~500ms to <50ms
2. **Pre-load dictionary** - Call `loadDictionary()` on app init
3. **Use incremental checking** - For editors with frequent updates
4. **Debounce checks** - Wait 1-2 seconds after user stops typing

## Dictionary Files

The library uses Hunspell dictionary format:

- `.aff` - Affix rules (prefixes, suffixes, replacements)
- `.dic` - Word list with affix flags

Download dictionaries from:
- [LibreOffice Dictionaries](https://github.com/LibreOffice/dictionaries)
- [Hunspell Dictionaries](https://github.com/hunspell/hunspell)

## License

MIT

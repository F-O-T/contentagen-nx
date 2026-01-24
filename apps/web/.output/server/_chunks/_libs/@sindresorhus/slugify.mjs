import { e as escapeStringRegexp } from "../../../_libs/escape-string-regexp.mjs";
import { t as transliterate } from "./transliterate.mjs";
const overridableReplacements = [
  ["&", " and "],
  ["🦄", " unicorn "],
  ["♥", " love "]
];
const decamelize = (string) => {
  return string.replace(/([A-Z]{2,})(\d+)/g, "$1 $2").replace(/([a-z\d]+)([A-Z]{2,})/g, "$1 $2").replace(/([a-z\d])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-rt-z\d]+)/g, "$1 $2");
};
const removeMootSeparators = (string, separator) => {
  const escapedSeparator = escapeStringRegexp(separator);
  return string.replace(new RegExp(`${escapedSeparator}{2,}`, "g"), separator).replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"), "");
};
const buildPatternSlug = (options) => {
  let negationSetPattern = "a-z\\d";
  negationSetPattern += options.lowercase ? "" : "A-Z";
  if (options.preserveCharacters.length > 0) {
    for (const character of options.preserveCharacters) {
      if (character === options.separator) {
        throw new Error(`The separator character \`${options.separator}\` cannot be included in preserved characters: ${options.preserveCharacters}`);
      }
      negationSetPattern += escapeStringRegexp(character);
    }
  }
  return new RegExp(`[^${negationSetPattern}]+`, "g");
};
function slugify(string, options) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a string, got \`${typeof string}\``);
  }
  options = {
    separator: "-",
    lowercase: true,
    decamelize: true,
    customReplacements: [],
    preserveLeadingUnderscore: false,
    preserveTrailingDash: false,
    preserveCharacters: [],
    ...options
  };
  const shouldPrependUnderscore = options.preserveLeadingUnderscore && string.startsWith("_");
  const shouldAppendDash = options.preserveTrailingDash && string.endsWith("-");
  const customReplacements = new Map([
    ...overridableReplacements,
    ...options.customReplacements
  ]);
  string = transliterate(string, { customReplacements });
  if (options.decamelize) {
    string = decamelize(string);
  }
  const patternSlug = buildPatternSlug(options);
  if (options.lowercase) {
    string = string.toLowerCase();
  }
  string = string.replace(/([a-zA-Z\d]+)'([ts])(\s|$)/g, "$1$2$3");
  string = string.replace(patternSlug, options.separator);
  string = string.replace(/\\/g, "");
  if (options.separator) {
    string = removeMootSeparators(string, options.separator);
  }
  if (shouldPrependUnderscore) {
    string = `_${string}`;
  }
  if (shouldAppendDash) {
    string = `${string}-`;
  }
  return string;
}
function slugifyWithCounter() {
  const occurrences = /* @__PURE__ */ new Map();
  const countable = (string, options) => {
    string = slugify(string, options);
    if (!string) {
      return "";
    }
    const stringLower = string.toLowerCase();
    const numberless = occurrences.get(stringLower.replace(/(?:-\d+?)+?$/, "")) || 0;
    const counter = occurrences.get(stringLower);
    occurrences.set(stringLower, typeof counter === "number" ? counter + 1 : 1);
    const newCounter = occurrences.get(stringLower) || 2;
    if (newCounter >= 2 || numberless > 2) {
      string = `${string}-${newCounter}`;
    }
    return string;
  };
  countable.reset = () => {
    occurrences.clear();
  };
  return countable;
}
export {
  slugify as default,
  slugifyWithCounter
};

/**
 * Public API: resolve country names, codes, and aliases to canonical
 * ISO 3166-1 alpha-3 codes. Country data lives in `./countries`.
 *
 * The top-level `lookup` / `lookupAlpha3` and the `byAlpha3` / `byAlpha2` /
 * `byM49` maps are a default instance built over the bundled `COUNTRIES`
 * dataset. To add custom records (private codes for sub-national regions,
 * historical countries, disputed areas, etc.), call `createLookup` with your
 * own record array and use the returned scoped helpers.
 */

import { COUNTRIES, type CountryRecord } from "./countries.js";

export { COUNTRIES, type CountryRecord } from "./countries.js";

/**
 * Normalize an input string for name/alias matching.
 *
 *   - lowercases
 *   - strips Latin combining diacritical marks (so "Côte" → "cote", "Türkiye" → "turkiye")
 *   - strips Arabic diacritics — fatha/kasra/shadda/sukun/etc. (so "إتَّحَاد"
 *     matches "اتحاد")
 *   - strips apostrophes — straight and curly (so "Côte d'Ivoire" matches
 *     "Cote dIvoire" and "people's republic" matches "peoples republic")
 *   - replaces `&` with ` and `
 *   - strips `.`, `()`, and `,` (so "U.K." matches "UK", "Iran (Islamic
 *     Republic of)" matches "Iran Islamic Republic of")
 *   - replaces `-` / `–` / `—` with a space (so "Guinea-Bissau" matches
 *     "Guinea Bissau")
 *   - expands `st` to `saint` as a whole word (so "St. Kitts" matches the
 *     canonical "Saint Kitts and Nevis")
 *   - trims and collapses internal whitespace
 *   - drops a single leading `the ` (so "the UK" matches "UK")
 *
 * Exported for advanced use: consumers normalizing batches of country
 * references against external data can produce keys identical to the
 * lookup's internal name/alias index by calling this.
 */
export function sanitize(s: string): string {
    return s
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .normalize("NFC")
        .toLowerCase()
        .replace(/[ً-ٟ]/g, "")
        .replace(/['‘’ʻʼʽˈ′`]/g, "")
        .replace(/&/g, " and ")
        .replace(/[.(),]/g, "")
        .replace(/[-–—]/g, " ")
        .replace(/\bst\b/g, "saint")
        .trim()
        .replace(/\s+/g, " ")
        .replace(/^the\s+/, "");
}

/**
 * A scoped country lookup built over a specific set of `CountryRecord`s.
 * The top-level `lookup` / `lookupAlpha3` and `byAlpha3` / `byAlpha2` /
 * `byM49` exports are a `CountryLookup` over the bundled `COUNTRIES`.
 */
export interface CountryLookup {
    /** Resolve any supported input to the matching record. */
    lookup(input: string | number): CountryRecord | undefined;
    /** Resolve any supported input to its alpha-3 code. */
    lookupAlpha3(input: string | number): string | undefined;
    /** Records keyed by ISO 3166-1 alpha-3 code. */
    byAlpha3: ReadonlyMap<string, CountryRecord>;
    /** Records keyed by ISO 3166-1 alpha-2 code. Records with blank `iso2` are excluded. */
    byAlpha2: ReadonlyMap<string, CountryRecord>;
    /** Records keyed by 3-digit zero-padded UN M49. Records with blank `m49` are excluded. */
    byM49: ReadonlyMap<string, CountryRecord>;
}

/**
 * Build a country lookup over the supplied records.
 *
 * Use this to extend or replace the bundled `COUNTRIES` dataset — for
 * example, to add private codes for sub-national regions, historical
 * countries, or disputed areas. Pass `[...COUNTRIES, ...yourRecords]` to
 * keep the canonical data and layer your own records on top.
 *
 * Throws if two records' names or aliases collapse to the same sanitized
 * key — surfaces alias collisions at construction time so they can be
 * fixed before any lookups happen.
 */
export function createLookup(records: ReadonlyArray<CountryRecord>): CountryLookup {
    const byAlpha3 = new Map<string, CountryRecord>();
    const byAlpha2 = new Map<string, CountryRecord>();
    const byM49 = new Map<string, CountryRecord>();
    for (const c of records) {
        byAlpha3.set(c.iso3, c);
        // Skip blank iso2/m49 (e.g. user-assigned codes for disputed areas) so
        // an empty-string key doesn't accidentally collide across records.
        if (c.iso2) byAlpha2.set(c.iso2, c);
        if (c.m49) byM49.set(c.m49, c);
    }

    const byName = new Map<string, string>();
    for (const c of records) {
        for (const raw of [c.name, ...c.aliases]) {
            const key = sanitize(raw);
            const existing = byName.get(key);
            // After sanitize, multiple aliases for the same country may collapse
            // to the same key (e.g. "côte d'ivoire" and "cote d'ivoire" both
            // become "cote divoire"). That's fine — they point to the same
            // iso3. Only throw on a genuine cross-country collision.
            if (existing !== undefined && existing !== c.iso3) {
                throw new Error(`Duplicate name/alias "${key}": ${existing} vs ${c.iso3}`);
            }
            byName.set(key, c.iso3);
        }
    }

    function lookup(input: string | number): CountryRecord | undefined {
        // Guard against null/undefined/empty strings
        if (input == null) return undefined;
        const s = String(input).trim();
        if (!s) return undefined;

        if (/^\d+$/.test(s)) {
            const hit = byM49.get(String(parseInt(s, 10)).padStart(3, "0"));
            if (hit) return hit;
        }
        if (/^[A-Za-z]{2}$/.test(s)) {
            const hit = byAlpha2.get(s.toUpperCase());
            if (hit) return hit;
        }
        if (/^[A-Za-z]{3}$/.test(s)) {
            const hit = byAlpha3.get(s.toUpperCase());
            if (hit) return hit;
        }

        const iso3 = byName.get(sanitize(s));
        return iso3 === undefined ? undefined : byAlpha3.get(iso3);
    }

    function lookupAlpha3(input: string | number): string | undefined {
        return lookup(input)?.iso3;
    }

    return { lookup, lookupAlpha3, byAlpha3, byAlpha2, byM49 };
}

const _default = createLookup(COUNTRIES);

/**
 * Resolve a user-provided country reference to its full `CountryRecord`.
 *
 * Accepts:
 *   - alpha-3, case-insensitive (e.g. `"FRA"`, `"fra"`)
 *   - alpha-2, case-insensitive (e.g. `"FR"`, `"fr"`)
 *   - UN M49 numeric, as a number or any numeric string (e.g. `250`, `"250"`,
 *     `4`, `"04"`, `"0250"`); leading zeros are stripped and the result is
 *     zero-padded to 3 digits before lookup
 *   - a country name or alias, case-insensitive. Input is sanitized before
 *     matching: diacritics are stripped (`Türkiye` → `turkiye`), apostrophes
 *     and `.` `()` `,` are dropped, `&` is mapped to `and`, `-`/`–`/`—` become
 *     spaces, `st` expands to `saint`, a leading `the ` is dropped, and
 *     internal whitespace is collapsed.
 *
 * Returns the matching record, or `undefined` when no record matches.
 *
 * @param input - country identifier in any supported form
 */
export const lookup = _default.lookup;

/**
 * Resolve a user-provided country reference to its ISO 3166-1 alpha-3 code.
 * Convenience wrapper around `lookup` that returns only the iso3 string.
 */
export const lookupAlpha3 = _default.lookupAlpha3;

/**
 * `COUNTRIES` keyed by ISO 3166-1 alpha-3 (uppercase). Use `.get(code)` to
 * retrieve the full record — e.g. `byAlpha3.get("FRA")?.name` → `"France"`.
 * Keys are exactly the iso3 strings as stored on each record (no case folding
 * on lookup); pass uppercase, or use `lookup` for case-insensitive matching.
 */
export const byAlpha3: ReadonlyMap<string, CountryRecord> = _default.byAlpha3;

/**
 * `COUNTRIES` keyed by ISO 3166-1 alpha-2 (uppercase). Same access pattern as
 * `byAlpha3`. Records with a blank `iso2` are excluded from this map.
 */
export const byAlpha2: ReadonlyMap<string, CountryRecord> = _default.byAlpha2;

/**
 * `COUNTRIES` keyed by UN M49 numeric code as a 3-digit zero-padded string
 * (e.g. `"004"` for Afghanistan, `"250"` for France). Pass the exact string
 * form — `byM49.get(4)` won't work; use `lookup(4)` to resolve a raw number.
 * Records with a blank `m49` are excluded from this map.
 */
export const byM49: ReadonlyMap<string, CountryRecord> = _default.byM49;

/**
 * Public API: resolve country names, codes, and aliases to canonical
 * ISO 3166-1 alpha-3 codes. Country data lives in `./countries`.
 */

import { COUNTRIES, COUNTRIES_X, type CountryRecord } from "./countries.js";

export { COUNTRIES, COUNTRIES_X, type CountryRecord } from "./countries.js";

const _byAlpha3 = new Map<string, CountryRecord>();
const _byAlpha2 = new Map<string, CountryRecord>();
const _byM49 = new Map<string, CountryRecord>();
for (const c of COUNTRIES) {
    _byAlpha3.set(c.iso3, c);
    _byAlpha2.set(c.iso2, c);
    _byM49.set(c.m49, c);
}
export const byAlpha3: ReadonlyMap<string, CountryRecord> = _byAlpha3;
export const byAlpha2: ReadonlyMap<string, CountryRecord> = _byAlpha2;
export const byM49: ReadonlyMap<string, CountryRecord> = _byM49;

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
 *   - trims and collapses internal whitespace
 *   - drops a single leading `the ` (so "the UK" matches "UK")
 */
function sanitize(s: string): string {
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
        .trim()
        .replace(/\s+/g, " ")
        .replace(/^the\s+/, "");
}

function indexNames(records: ReadonlyArray<CountryRecord>): Map<string, string> {
    const m = new Map<string, string>();
    for (const c of records) {
        for (const raw of [c.name, ...c.aliases]) {
            const key = sanitize(raw);
            const existing = m.get(key);
            // After sanitize, multiple aliases for the same country may collapse
            // to the same key (e.g. "côte d'ivoire" and "cote d'ivoire" both
            // become "cote divoire"). That's fine — they point to the same
            // iso3. Only throw on a genuine cross-country collision.
            if (existing !== undefined && existing !== c.iso3) {
                throw new Error(`Duplicate name/alias "${key}": ${existing} vs ${c.iso3}`);
            }
            m.set(key, c.iso3);
        }
    }

    return m;
}

const byName = indexNames(COUNTRIES);
const byNameX = indexNames(COUNTRIES_X);
const byAlpha3X: Map<string, CountryRecord> = new Map();
for (const c of COUNTRIES_X) byAlpha3X.set(c.iso3, c);

export interface LookupOptions {
    /** When true, also match custom disputed-area codes from COUNTRIES_X. */
    includeDisputedAreas?: boolean;
}

/**
 * Resolve a user-provided country reference to its ISO 3166-1 alpha-3 code.
 *
 * Accepts:
 *   - alpha-3, case-insensitive (e.g. `"FRA"`, `"fra"`)
 *   - alpha-2, case-insensitive (e.g. `"FR"`, `"fr"`)
 *   - UN M49 numeric, as number or string with up to 3 digits (e.g. `250`, `"250"`, `4`, `"04"`)
 *   - a country name or alias, case-insensitive. Input is sanitized before
 *     matching: diacritics are stripped (`Türkiye` → `turkiye`), apostrophes
 *     and `.` `()` `,` are dropped, `&` is mapped to `and`, `-`/`–`/`—` become
 *     spaces, a leading `the ` is dropped, and internal whitespace is collapsed.
 *
 * Returns the canonical alpha-3, or `undefined` when no record matches.
 *
 * Note: numeric strings longer than 3 digits (e.g. `"0250"`) are not zero-stripped
 * and will not resolve. Use the integer form (`250`) or a 3-digit string.
 *
 * @param input - country identifier in any supported form
 * @param options - pass `{ includeDisputedAreas: true }` to also resolve custom
 *   X codes by alpha-3, name, or alias
 */
export function lookupAlpha3(input: string | number, options?: LookupOptions): string | undefined {
    // Guard against null/undefined/empty strings
    if (input == null) return undefined;
    const s = String(input).trim();
    if (!s) return undefined;

    const includeX = !!options?.includeDisputedAreas;

    if (/^\d+$/.test(s)) {
        const hit = byM49.get(s.padStart(3, "0"))?.iso3;
        if (hit) return hit;
    }
    if (/^[A-Za-z]{2}$/.test(s)) {
        const hit = byAlpha2.get(s.toUpperCase())?.iso3;
        if (hit) return hit;
    }
    if (/^[A-Za-z]{3}$/.test(s)) {
        const upper = s.toUpperCase();
        const hit = byAlpha3.get(upper)?.iso3 ?? (includeX ? byAlpha3X.get(upper)?.iso3 : undefined);
        if (hit) return hit;
    }

    const key = sanitize(s);

    return byName.get(key) ?? (includeX ? byNameX.get(key) : undefined);
}

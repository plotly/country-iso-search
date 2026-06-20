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

function indexNames(records: ReadonlyArray<CountryRecord>): Map<string, string> {
    const m = new Map<string, string>();
    for (const c of records) {
        for (const key of [c.name.toLowerCase(), ...c.aliases]) {
            const existing = m.get(key);
            if (existing !== undefined) {
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
 *   - a country name or alias (case-insensitive, exact match after trimming and
 *     collapsing internal whitespace)
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

    // Replace multiple spaces with one space
    const cleaned = s.replace(/\s+/g, " ").toLowerCase();

    return byName.get(cleaned) ?? (includeX ? byNameX.get(cleaned) : undefined);
}

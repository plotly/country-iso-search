/**
 * Alpine component behind the demo page.
 */

import { byAlpha2, byAlpha3, byM49, COUNTRIES, lookup, sanitize } from "../dist/index.js";

/** Inputs worth showing off — one per supported input form. */
const EXAMPLES = [
    { value: "FRA", note: "ISO 3166-1 alpha-3" },
    { value: "FR", note: "ISO 3166-1 alpha-2" },
    { value: "250", note: "UN M49 numeric" },
    { value: "04", note: "UN M49, zero-padded to 004" },
    { value: "Türkiye", note: "diacritics are stripped before matching" },
    { value: "Ivory Coast", note: "common alternate name" },
    { value: "Burma", note: "historical name" },
    { value: "St. Kitts and Nevis", note: "`st` expands to `saint`" },
    { value: "🇯🇵", note: "flag emoji" },
    { value: "Korea, the Republic of", note: "ISO short-name form" },
    { value: "not a country", note: "no match — returns undefined" },
];

/**
 * Which input form resolved `record`, mirroring the precedence in `lookup`
 * (M49 → alpha-2 → alpha-3 → name/alias).
 */
function matchedBy(raw, record) {
    const s = String(raw).trim();
    const is = (hit) => hit !== undefined && hit.iso3 === record.iso3;
    if (/^\d+$/.test(s) && is(byM49.get(String(parseInt(s, 10)).padStart(3, "0")))) {
        return "UN M49 numeric";
    }
    if (/^[A-Za-z]{2}$/.test(s) && is(byAlpha2.get(s.toUpperCase()))) return "ISO alpha-2";
    if (/^[A-Za-z]{3}$/.test(s) && is(byAlpha3.get(s.toUpperCase()))) return "ISO alpha-3";
    if (sanitize(s) === sanitize(record.name)) return "canonical name";
    return "alias";
}

document.addEventListener("alpine:init", () => {
    Alpine.data("demo", () => ({
        query: "",
        copied: "",
        examples: EXAMPLES,
        recordCount: COUNTRIES.length,

        get result() {
            return lookup(this.query) ?? null;
        },

        get normalized() {
            return sanitize(this.query.trim());
        },

        get matchedBy() {
            return this.result === null ? "" : matchedBy(this.query, this.result);
        },

        get snippet() {
            if (this.result === null) return "";
            const q = this.query.trim();
            // Numerics read better unquoted, but skip anything with a leading
            // zero so the snippet stays copy-pasteable JavaScript.
            const arg = /^[1-9]\d*$/.test(q) ? q : JSON.stringify(q);
            return `lookupAlpha3(${arg}); // ${JSON.stringify(this.result.iso3)}`;
        },

        /**
         * Demo-only convenience: the library matches exactly, so a near miss
         * (`"republic of kor"`) resolves to nothing. Scan the dataset for terms
         * containing the query to point at the string that would work. One
         * suggestion per country, prefix matches first.
         */
        get suggestions() {
            const key = this.normalized;
            if (key.length < 2 || this.result !== null) return [];
            const prefix = [];
            const contains = [];
            for (const c of COUNTRIES) {
                for (const term of [c.name, ...c.aliases]) {
                    if (!sanitize(term).includes(key)) continue;
                    const hit = { term, iso3: c.iso3 };
                    if (sanitize(term).startsWith(key)) prefix.push(hit);
                    else contains.push(hit);
                    break;
                }
            }
            return [...prefix, ...contains].slice(0, 8);
        },

        run(value) {
            this.query = value;
            this.$refs.query?.focus();
        },

        async copy(text) {
            try {
                await navigator.clipboard.writeText(text);
                this.copied = text;
                setTimeout(() => {
                    if (this.copied === text) this.copied = "";
                }, 1500);
            } catch {
                // Clipboard blocked so there's nothing to do
            }
        },
    }));
});

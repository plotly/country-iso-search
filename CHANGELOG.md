# country-iso-search changelog

For more context information, please read through the
[release notes](https://github.com/plotly/country-iso-search/releases).

To see all merged commits on the main branch that will be part of the next country-iso-search release, go to:

<https://github.com/plotly/country-iso-search/compare/vX.Y.Z...main>

where X.Y.Z is the semver of the most recent country-iso-search release.


## [Unreleased]

Initial release.

### Added
- `lookupAlpha3(input, options?)` resolves a country reference to its ISO 3166-1 alpha-3 code. Accepts alpha-3 (`"FRA"`, case-insensitive), alpha-2 (`"FR"`, case-insensitive), UN M49 numeric as number or string up to 3 digits (`250`, `"250"`, `4`, `"04"`), or a country name / alias (case-insensitive; trimmed and internal-whitespace-collapsed before matching).
- Code-shape fall-through: when an input matches a code-shape regex (numeric / alpha-2 / alpha-3) but isn't a real code, it falls through to the alias index — enables alias-only forms like `"UK"` → `GBR`.
- Opt-in disputed-area codes: pass `{ includeDisputedAreas: true }` to also resolve the five custom X-codes (`XAC`, `XAP`, `XBT`, `XHT`, `XJK`).
- 249 ISO 3166-1 records in `COUNTRIES`.
- 5 custom disputed-area records in `COUNTRIES_X` (Aksai Chin, Arunachal Pradesh, Bir Tawil, Halaib Triangle, Jammu and Kashmir). Excluded from the default lookup; `iso2` and `m49` intentionally blank.
- ~1,900 aliases in total, averaging ~8 per record (up to 30 on the most heavily-aliased), covering English long forms (`Republic of X`, `Kingdom of X`, etc.), historical official names (Burma, Persia, Ceylon, Formosa, Zaire, Rhodesia, etc.), native-language names in each country's official languages, flag emojis (e.g. `🇫🇷` → `FRA`) generated from alpha-2, and common typo / diacritic-stripped variants (`bangla desh`, `hongkong`, `srilanka`). Native-language names were drawn from CLDR, Wikidata (filtered to languages tagged official via P37), and GeoNames, then curated by hand to resolve substring collisions and normalize transliterations.
- All aliases sorted alphabetically within each record.
- Duplicate-detection at module load: any duplicate name/alias across records throws on import.
- `COUNTRIES`, `COUNTRIES_X` exported as `ReadonlyArray<CountryRecord>`.
- `byAlpha3`, `byAlpha2`, `byM49` exported as `ReadonlyMap<string, CountryRecord>` lookups over `COUNTRIES`.
- `CountryRecord`, `LookupOptions` TypeScript types exported.
- ESM-only package (`"type": "module"`); targets ESM Node and modern bundlers (`"module": "nodenext"`); ships TypeScript declarations in `dist/`. MIT license.

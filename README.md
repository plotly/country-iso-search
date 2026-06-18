# country-iso-search

Resolve country names and codes to their canonical ISO 3166-1 alpha-3 form.

<br/>
<div align="center">
  <a href="https://dash.plotly.com/project-maintenance">
    <img src="https://dash.plotly.com/assets/images/maintained-by-plotly.png" width="400px" alt="Maintained by Plotly">
  </a>
</div>
<br/>

---

Accepts alpha-3 (`"FRA"`), alpha-2 (`"FR"`), UN M49 numeric (`250` or `"250"`; short codes like `4` or `"04"` are zero-padded), or a country name / alias (case-insensitive, exact match after trim + internal-whitespace collapse). Returns the canonical alpha-3, or `undefined` when no record matches.

## Install

```bash
npm install country-iso-search
```

## Usage

```ts
import { lookupAlpha3 } from 'country-iso-search';

lookupAlpha3('FRA');           // 'FRA'
lookupAlpha3('FR');            // 'FRA'
lookupAlpha3(250);             // 'FRA' (M49 numeric)
lookupAlpha3('04');            // 'AFG' (zero-padded to '004')
lookupAlpha3('France');        // 'FRA'
lookupAlpha3('Burma');         // 'MMR' (historical name)
lookupAlpha3('Türkiye');       // 'TUR'
lookupAlpha3('🇯🇵');            // 'JPN' (flag emoji)
lookupAlpha3('not a country'); // undefined
```

## Disputed-area codes (opt-in)

The package ships custom codes for disputed-area features. These are **not** ISO 3166-1 / M49 and are excluded from `lookupAlpha3` by default. Pass `{ includeDisputedAreas: true }` to opt in:

```ts
lookupAlpha3('XAC');                                       // undefined
lookupAlpha3('XAC', { includeDisputedAreas: true });       // 'XAC'
lookupAlpha3('Aksai Chin', { includeDisputedAreas: true }); // 'XAC'
```

`iso2` and `m49` are blank on every X record. Only alpha-3 and name/alias lookups resolve to X records.

## API

### `lookupAlpha3(input, options?)`

- `input: string | number` — country identifier in any supported form.
- `options?: { includeDisputedAreas?: boolean }` — when `true`, also match custom disputed-area codes.
- Returns `string | undefined`.

### Exports

- `COUNTRIES: ReadonlyArray<CountryRecord>` — standard ISO 3166-1 / M49 records.
- `COUNTRIES_X: ReadonlyArray<CountryRecord>` — custom disputed-area records.
- `byAlpha3`, `byAlpha2`, `byM49` — `ReadonlyMap<string, CountryRecord>` lookups over `COUNTRIES` (use `.get(key)`; e.g. `byAlpha3.get('FRA')?.name`).
- `CountryRecord`, `LookupOptions` — TypeScript types.

### `CountryRecord`

```ts
interface CountryRecord {
    iso3: string;               // ISO 3166-1 alpha-3
    iso2: string;               // ISO 3166-1 alpha-2 (blank for X records)
    m49: string;                // UN M49, 3-digit zero-padded (blank for X records)
    name: string;               // English short name from UN M49
    aliases: readonly string[]; // additional lowercased forms — historical names,
                                //   common alternates, native-language variants,
                                //   and the country's flag emoji
}
```

## Data

`COUNTRIES` mirrors UN M49 / ISO 3166-1 for `iso3`, `iso2`, `m49`, and `name`. The ~1,900 aliases were assembled from CLDR, Wikidata (filtered to languages tagged official via P37), and GeoNames, then **curated by hand** to resolve substring collisions (e.g. Niger vs. Nigeria, Guinea vs. Guinea-Bissau vs. Equatorial Guinea vs. Papua New Guinea), normalize transliterations, and drop variants that would produce false matches. The list is updated editorially — there is no regeneration script. To add an alias or fix an entry, edit [src/index.ts](src/index.ts) directly and open a pull request.

`COUNTRIES_X` ships Plotly-specific user-assigned codes for disputed-area features (`XAC`, `XAP`, `XBT`, `XHT`, `XJK`) that are not part of ISO 3166-1 or M49.

GeoNames (CC BY 4.0) and Unicode CLDR (Unicode License V3) require attribution. The full third-party notices live in [NOTICE](NOTICE) in this repository — **consult that file before redistributing this package or its data**, since it carries the attribution texts those licenses require to travel with downstream redistributions. Wikidata is CC0 and is acknowledged there as a courtesy.

## License

MIT — see [LICENSE](LICENSE). Third-party data attributions: [NOTICE](NOTICE).

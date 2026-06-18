# Contributing to country-iso-search

Thanks for your interest in contributing! This document explains how changes get made to this library and how to set up a local development environment.

## Code of Conduct

Please review the [Code of Conduct](CODE_OF_CONDUCT.md) before participating. In short: be welcoming, be respectful, and focus on what's best for the project and the community.

## What this library is

`country-iso-search` is a small, single-purpose library: it resolves a country reference (alpha-3, alpha-2, UN M49 numeric, or a country name / alias) to a canonical ISO 3166-1 alpha-3 code. The data table is **curated by hand** from UN M49, ISO 3166-1, CLDR, Wikidata, and GeoNames. There is no generation script — every entry encodes an editorial decision.

Most contributions take one of three shapes:

1. **Alias additions or corrections** — a missing historical name, a native-language form, a common typo. These are the easiest and most common contributions.
2. **Data corrections** — a wrong M49 code, a renamed country (e.g. Türkiye, North Macedonia, Eswatini), a newly admitted country.
3. **Logic changes or new exports** — a new matching option, a new lookup helper. These usually start with an issue for discussion before code.

## How changes get made

The basic flow is similar to other Plotly libraries:

1. **Discussion** — open an issue describing what you want to change and why. For alias additions, mention the source you're drawing from (a CLDR locale, a Wikidata language tag, an authoritative reference document). For logic changes, describe the use case the current API doesn't serve.
2. **Proposal** — for non-trivial changes, propose the specific edit (which records, which aliases, which API shape). This is where maintainers can flag conflicts before you write code — for example, an alias collision with an existing record's name.
3. **Iteration** — maintainers and other community members give feedback. For alias contributions, expect questions about provenance and whether the form would collide with another country.
4. **Development** — branch, edit [src/index.ts](src/index.ts), add or update tests, and open a pull request.
5. **Review** — a maintainer reviews. Iteration may continue.
6. **Merge** — the change lands on `main` and ships with the next release (see [RELEASE.md](RELEASE.md)).

For obvious fixes (a typo, a documented-but-missing alias, a broken link), feel free to skip the discussion step and open a PR directly.

## Opening issues

Please use the [bug report](.github/ISSUE_TEMPLATE/bug_report.md) or [feature request](.github/ISSUE_TEMPLATE/feature_request.md) templates. Before filing, please search for existing and closed issues — alias requests in particular tend to recur.

For security reports, please follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Making pull requests

Please follow the [pull request template](.github/PULL_REQUEST_TEMPLATE.md). In short:

- Branch off the latest `main`. Do not open PRs from your own `main`.
- Run `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` locally before pushing.
- For alias additions, make sure the new aliases are lowercased and sorted alphabetically within each record (the existing data is sorted; new entries should match).
- Don't force-push to remote branches once the PR is open — it makes review difficult. Merge `main` in if you need to update.

## Development

### Prerequisites

- [git](https://git-scm.com/)
- [asdf](https://asdf-vm.com/) (recommended) or another Node version manager that respects `.tool-versions` / `.nvmrc`. The repo pins a specific Node version in [.tool-versions](.tool-versions).
- npm v10 or higher to keep [package-lock.json](package-lock.json) consistent.

### Setup

```bash
git clone git@github.com:plotly/country-iso-search.git
cd country-iso-search
asdf install      # installs the Node version from .tool-versions
npm ci
```

### Scripts

| Command | Purpose |
|---|---|
| `npm run lint` | Run Biome (linter + formatter check). |
| `npm run format` | Apply Biome's lint + format fixes. |
| `npm run typecheck` | Run `tsc --noEmit`. |
| `npm test` | Run the vitest suite once. |
| `npm run test:watch` | Run vitest in watch mode while iterating. |
| `npm run build` | Emit ESM + CJS bundles and type declarations (`dist/index.{js,cjs,d.ts,d.cts}`) via `tsup`. `--clean` wipes `dist/` first. |

CI runs `typecheck`, `test`, and `build` on every PR — see [.github/workflows/test.yml](.github/workflows/test.yml).

### Adding an alias

1. Find the country's record in [src/index.ts](src/index.ts). Records are alphabetically ordered by ISO 3166-1 alpha-3 code.
2. Add the new alias to the `aliases` array. It must be **lowercased** (input is lowercased before matching) and kept **sorted alphabetically** within the array. Use the existing entries as a style guide.
3. Run `npm test`. The duplicate-detection check runs at module load — if your alias collides with another record's name or alias, the tests will throw on import with a clear "Duplicate name/alias" error pointing at the collision.
4. If you're confident the alias is a common one, consider adding a regression test in [src/index.test.ts](src/index.test.ts) to lock in the resolution. The existing "regex collision regression tests" and "United Kingdom aliases" blocks are good models.

### Adding a country (rare)

If a new country is admitted to ISO 3166-1 or M49, add the full record (alpha-3, alpha-2, M49, name, aliases) at the correct alphabetical position. Coordinate with maintainers — these changes usually warrant a minor version bump and a CHANGELOG entry under `### Added`.

### Touching the lookup logic

Logic changes live in `lookupAlpha3` and its helpers at the bottom of [src/index.ts](src/index.ts). Keep changes small, add tests, and call out any behavior change in the PR description so it can be reflected accurately in the CHANGELOG.

## Releases

Releases are cut by maintainers following [RELEASE.md](RELEASE.md). Contributors don't need to bump versions or update CHANGELOG entries beyond what's natural for the change — maintainers will roll them into the release PR.

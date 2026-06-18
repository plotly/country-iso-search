# Release process

How to publish a new version of `country-iso-search` to npm.

## Prerequisites

- Write access to the `country-iso-search` repository on GitHub.
- npm publish access to the `country-iso-search` package (`npm whoami` to confirm you're logged in; `npm access list packages` to confirm permission).
- npm 2FA enrolled — npm will prompt for an OTP during `npm publish`.
- A clean working tree on an up-to-date `main`.

All release-prep changes (version bump, CHANGELOG update) ship through a PR — **direct commits to `main` are not allowed**. The tag and `npm publish` happen after the PR merges.

## 1. Pre-flight

```bash
git checkout main
git pull --ff-only
git status            # must be clean
```

Confirm CI is green on `main` (see [`.github/workflows/test.yml`](.github/workflows/test.yml)).

## 2. Pick the version

Follow [semver](https://semver.org/):

- **patch** (`0.1.0` → `0.1.1`) — bug fixes, alias additions, data corrections that don't change resolution for previously-resolved inputs.
- **minor** (`0.1.0` → `0.2.0`) — new exports, new options, new resolutions for previously-unresolved inputs.
- **major** (`0.1.0` → `1.0.0`) — removed/renamed exports, changed resolution for previously-resolved inputs, breaking type changes.

Pre-1.0, breaking changes may ship in a minor bump — call them out clearly in the changelog.

## 3. Create a release-prep branch

```bash
git checkout -b release-X.Y.Z       # e.g. release-0.1.1
```

## 4. Update [CHANGELOG.md](CHANGELOG.md)

Insert a new versioned heading **below** the `## [Unreleased]` heading with today's date (UTC), and move the accumulated entries from under `## [Unreleased]` to under the new heading:

```markdown
## [Unreleased]

## [0.1.1] -- 2026-06-17

### Added
- (entries that were previously under Unreleased)
```

The `## [Unreleased]` heading **stays in place** — empty, ready to catch entries for the next cycle. Do not rename it.

Make sure the entries underneath the new dated heading are split into `### Added`, `### Changed`, and `### Fixed` as applicable. PR-linked entries follow the `[[#NNNN](https://github.com/plotly/country-iso-search/pull/NNNN)]` format used in [plotly.js](https://github.com/plotly/plotly.js/blob/master/CHANGELOG.md).

## 5. Bump the version (no tag yet)

Use `--no-git-tag-version` so npm only edits `package.json` without committing or tagging — the commit comes from the PR merge, and the tag goes on the merge commit (step 9).

```bash
npm version <patch|minor|major> --no-git-tag-version    # or an explicit version, e.g. `npm version 0.2.0 --no-git-tag-version`
```

## 6. Verify the build

```bash
npm ci
npm run typecheck
npm test
npm run build         # emits dist/
```

Inspect what will actually ship:

```bash
npm pack --dry-run
```

Confirm the tarball contains `dist/index.js`, `dist/index.d.ts`, `package.json`, `README.md`, and `LICENSE` — and nothing under `src/` or `node_modules/`. The `files` field in [package.json](package.json) restricts the publish to `dist/` (plus the always-included `README.md`, `LICENSE`, and `package.json`). `CHANGELOG.md` and `NOTICE` live in the repo only — the README's License section links to `NOTICE` for downstream redistributors who need the third-party attribution texts, and npm consumers reach `CHANGELOG.md` via the GitHub link from [package.json](package.json)'s `homepage`/`repository`.

## 7. Open the release PR

Commit the version bump and CHANGELOG edit together, then push the branch:

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "Release vX.Y.Z"
git push origin release-X.Y.Z
```

Then open the PR on GitHub: <https://github.com/plotly/country-iso-search/compare/main...release-X.Y.Z?expand=1>. Title it `Release vX.Y.Z` and paste the new CHANGELOG section into the body so reviewers can scan the release scope. Wait for CI to pass and get the PR approved + merged.

## 8. Pull the merged main

```bash
git checkout main
git pull --ff-only
```

Verify `package.json` shows the new version and `CHANGELOG.md` has the dated heading.

## 9. Tag the merge commit

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

## 10. Publish to npm

```bash
npm publish
```

`prepublishOnly` will run `npm run build` automatically. Provide the 2FA OTP when prompted. Verify the release landed:

```bash
npm view country-iso-search version
```

…and check <https://www.npmjs.com/package/country-iso-search>.

## 11. Create the GitHub release

Draft a new release at <https://github.com/plotly/country-iso-search/releases/new> targeting the `vX.Y.Z` tag. Copy the matching section from [CHANGELOG.md](CHANGELOG.md) into the body.

No follow-up changelog-stub PR is needed — `## [Unreleased]` was left in place at step 4, so the next contributor already has a section to land their entry under.

## Rolling back a bad release

`npm` does not support overwriting a published version. If a release is broken:

1. Publish a follow-up patch release with the fix.
2. Optionally `npm deprecate country-iso-search@X.Y.Z "<reason — point to X.Y.Z+1>"` to warn installs of the bad version.
3. Avoid `npm unpublish` except within the 72-hour window and only for truly unusable releases — it breaks lockfiles for any consumer that already installed it.

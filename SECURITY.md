# country-iso-search Security Policy

The open source `country-iso-search` library is provided "AS IS", with no security guarantees. Please see our [license](https://raw.githubusercontent.com/plotly/country-iso-search/main/LICENSE) for more information.

`country-iso-search` is a pure-data lookup library: it takes a string or number, matches it against a static in-memory table, and returns a 3-letter code. It does not perform network requests, read or write files, execute external processes, or touch any I/O. The risk surface is therefore limited primarily to:

- denial-of-service from pathological inputs (e.g. extremely long strings), and
- correctness bugs where a known input resolves to the wrong country code.

## Reports

To report a security vulnerability, please email **security@plotly.com** with steps to reproduce the problem. Please allow up to 24 hours for an initial response.

## Release Process

`country-iso-search` security fixes are normally released as patch releases on top of the current version. For example, if the current version is `1.4.0` and we fix a security issue, we release `1.4.1` with the fix. Security fixes may also be combined with the next planned minor or major release if the timing aligns.

## Advisories

Security advisories are published as GitHub Security Advisories on this repository.

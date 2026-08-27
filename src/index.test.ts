import { describe, expect, it } from "vitest";
import {
    byAlpha2,
    byAlpha3,
    byM49,
    COUNTRIES,
    type CountryRecord,
    createLookup,
    lookup,
    lookupAlpha3,
    sanitize,
} from "./index.js";

describe("lookupAlpha3", () => {
    describe("alpha-3 input", () => {
        it("resolves uppercase alpha-3", () => {
            expect(lookupAlpha3("FRA")).toBe("FRA");
        });

        it("resolves lowercase alpha-3", () => {
            expect(lookupAlpha3("fra")).toBe("FRA");
        });

        it("resolves mixed-case alpha-3", () => {
            expect(lookupAlpha3("FrA")).toBe("FRA");
        });

        it("returns undefined for unknown alpha-3", () => {
            expect(lookupAlpha3("ZZZ")).toBeUndefined();
        });
    });

    describe("alpha-2 input", () => {
        it("resolves uppercase alpha-2", () => {
            expect(lookupAlpha3("FR")).toBe("FRA");
        });

        it("resolves lowercase alpha-2", () => {
            expect(lookupAlpha3("fr")).toBe("FRA");
        });

        it("returns undefined for unknown alpha-2", () => {
            expect(lookupAlpha3("ZZ")).toBeUndefined();
        });
    });

    describe("M49 numeric input", () => {
        it("resolves numeric M49", () => {
            expect(lookupAlpha3(250)).toBe("FRA");
        });

        it("resolves zero-padded M49 string", () => {
            expect(lookupAlpha3("250")).toBe("FRA");
        });

        it("pads short M49 strings to 3 digits", () => {
            expect(lookupAlpha3("4")).toBe("AFG");
            expect(lookupAlpha3("04")).toBe("AFG");
            expect(lookupAlpha3("004")).toBe("AFG");
        });

        it("strips leading zeros from numeric strings longer than 3 digits", () => {
            expect(lookupAlpha3("0250")).toBe("FRA");
            expect(lookupAlpha3("00004")).toBe("AFG");
        });

        it("returns undefined for unknown M49", () => {
            expect(lookupAlpha3("999")).toBeUndefined();
        });
    });

    describe("country name input", () => {
        it("resolves canonical name", () => {
            expect(lookupAlpha3("France")).toBe("FRA");
        });

        it("resolves lowercase name", () => {
            expect(lookupAlpha3("france")).toBe("FRA");
        });

        it("resolves names with diacritics", () => {
            expect(lookupAlpha3("Türkiye")).toBe("TUR");
            expect(lookupAlpha3("Côte d'Ivoire")).toBe("CIV");
        });

        it("strips diacritics so unaccented input still resolves", () => {
            expect(lookupAlpha3("Turkiye")).toBe("TUR");
            expect(lookupAlpha3("Cote d'Ivoire")).toBe("CIV");
            expect(lookupAlpha3("Aland Islands")).toBe("ALA");
        });

        it("matches apostrophe variants and apostrophe-less input", () => {
            expect(lookupAlpha3("Côte d’Ivoire")).toBe("CIV");
            expect(lookupAlpha3("Cote dIvoire")).toBe("CIV");
            expect(lookupAlpha3("Democratic Peoples Republic of Korea")).toBe("PRK");
        });

        it("maps '&' to 'and'", () => {
            expect(lookupAlpha3("Trinidad & Tobago")).toBe("TTO");
        });

        it("drops a leading 'the'", () => {
            expect(lookupAlpha3("the United States of America")).toBe("USA");
            expect(lookupAlpha3("The Netherlands")).toBe("NLD");
        });

        it("strips periods", () => {
            expect(lookupAlpha3("U.K.")).toBe("GBR");
            expect(lookupAlpha3("U.S.A.")).toBe("USA");
            expect(lookupAlpha3("St. Kitts and Nevis")).toBe("KNA");
        });

        it("expands 'st' to 'saint' as a whole word", () => {
            expect(lookupAlpha3("St Kitts and Nevis")).toBe("KNA");
            expect(lookupAlpha3("st lucia")).toBe("LCA");
            // 'st' inside another word must not be touched
            expect(lookupAlpha3("Estonia")).toBe("EST");
        });

        it("drops 'the' immediately after '(' or ',' (ISO short-name article)", () => {
            // (the) suffix forms — canonical name has no "the", so the regex
            // makes parens collapse to nothing.
            expect(lookupAlpha3("Bahamas (the)")).toBe("BHS");
            expect(lookupAlpha3("Philippines (the)")).toBe("PHL");
            // (the X of) qualifier forms.
            expect(lookupAlpha3("Korea (the Republic of)")).toBe("KOR");
            expect(lookupAlpha3("Korea (the Democratic People's Republic of)")).toBe("PRK");
            expect(lookupAlpha3("Iran (the Islamic Republic of)")).toBe("IRN");
            // Comma-the equivalents.
            expect(lookupAlpha3("Korea, the Republic of")).toBe("KOR");
            expect(lookupAlpha3("Bahamas, the")).toBe("BHS");
        });

        it("strips square brackets (ISO 'Falkland Islands (the) [Malvinas]')", () => {
            expect(lookupAlpha3("Falkland Islands (the) [Malvinas]")).toBe("FLK");
            expect(lookupAlpha3("Falkland Islands [Malvinas]")).toBe("FLK");
        });

        it("resolves ISO 'Svalbard and Jan Mayen' (UN M49 adds 'Islands')", () => {
            expect(lookupAlpha3("Jan Mayen")).toBe("SJM");
            expect(lookupAlpha3("Svalbard")).toBe("SJM");
            expect(lookupAlpha3("Svalbard and Jan Mayen")).toBe("SJM");
            expect(lookupAlpha3("Svalbard and Jan Mayen Islands")).toBe("SJM");
        });

        it("resolves individual components of 'X and Y' country names", () => {
            expect(lookupAlpha3("Antigua")).toBe("ATG");
            expect(lookupAlpha3("Barbuda")).toBe("ATG");
            expect(lookupAlpha3("Bonaire")).toBe("BES");
            expect(lookupAlpha3("Sint Eustatius")).toBe("BES");
            expect(lookupAlpha3("Saba")).toBe("BES");
            expect(lookupAlpha3("Herzegovina")).toBe("BIH");
            expect(lookupAlpha3("Heard Island")).toBe("HMD");
            expect(lookupAlpha3("McDonald Island")).toBe("HMD");
            expect(lookupAlpha3("Saint Kitts")).toBe("KNA");
            expect(lookupAlpha3("Nevis")).toBe("KNA");
            expect(lookupAlpha3("Saint Pierre")).toBe("SPM");
            expect(lookupAlpha3("Miquelon")).toBe("SPM");
            expect(lookupAlpha3("Sao Tome")).toBe("STP");
            expect(lookupAlpha3("Principe")).toBe("STP");
            expect(lookupAlpha3("Grenadines")).toBe("VCT");
            expect(lookupAlpha3("Ascension")).toBe("SHN");
            expect(lookupAlpha3("Tristan da Cunha")).toBe("SHN");
            expect(lookupAlpha3("Turks Islands")).toBe("TCA");
            expect(lookupAlpha3("Caicos Islands")).toBe("TCA");
        });

        it("preserves the COG/COD distinction (internal 'the' not dropped)", () => {
            // No comma/paren before "the" → regex doesn't touch it → the
            // article stays and the two Congos remain distinguishable.
            expect(lookupAlpha3("Republic of Congo")).toBe("COG");
            expect(lookupAlpha3("Republic of the Congo")).toBe("COD");
        });

        it("resolves ISO comma-inverted forms", () => {
            expect(lookupAlpha3("Korea, Republic of")).toBe("KOR");
            expect(lookupAlpha3("Korea, Democratic People's Republic of")).toBe("PRK");
            expect(lookupAlpha3("Moldova, Republic of")).toBe("MDA");
            expect(lookupAlpha3("Tanzania, United Republic of")).toBe("TZA");
            expect(lookupAlpha3("Palestine, State of")).toBe("PSE");
            expect(lookupAlpha3("Netherlands, Kingdom of the")).toBe("NLD");
            expect(lookupAlpha3("Congo, Democratic Republic of the")).toBe("COD");
            // These already work via the parenthesized canonical name + sanitize:
            expect(lookupAlpha3("Iran, Islamic Republic of")).toBe("IRN");
            expect(lookupAlpha3("Bolivia, Plurinational State of")).toBe("BOL");
            expect(lookupAlpha3("Micronesia, Federated States of")).toBe("FSM");
            expect(lookupAlpha3("Venezuela, Bolivarian Republic of")).toBe("VEN");
            expect(lookupAlpha3("Macedonia, the Former Yugoslav Republic Of")).toBe("MKD");
        });

        it("strips parens and treats hyphens as spaces", () => {
            expect(lookupAlpha3("Guinea Bissau")).toBe("GNB");
            expect(lookupAlpha3("Guinea–Bissau")).toBe("GNB");
            expect(lookupAlpha3("Iran Islamic Republic of")).toBe("IRN");
        });

        it("resolves names with parenthesized qualifiers", () => {
            expect(lookupAlpha3("Iran (Islamic Republic of)")).toBe("IRN");
        });

        it("collapses internal whitespace", () => {
            expect(lookupAlpha3("  United   States   of   America  ")).toBe("USA");
        });

        it("returns undefined for unknown name", () => {
            expect(lookupAlpha3("Atlantis")).toBeUndefined();
        });
    });

    describe("invalid input", () => {
        it("returns undefined for empty string", () => {
            expect(lookupAlpha3("")).toBeUndefined();
        });

        it("returns undefined for whitespace-only string", () => {
            expect(lookupAlpha3("   ")).toBeUndefined();
        });

        it("returns undefined for null and undefined", () => {
            // biome-ignore lint/suspicious/noExplicitAny: testing runtime null guard
            expect(lookupAlpha3(null as any)).toBeUndefined();
            // biome-ignore lint/suspicious/noExplicitAny: testing runtime undefined guard
            expect(lookupAlpha3(undefined as any)).toBeUndefined();
        });
    });
});

describe("lookup (full record)", () => {
    it("returns the matching CountryRecord by alpha-3", () => {
        const rec = lookup("FRA");
        expect(rec?.iso3).toBe("FRA");
        expect(rec?.iso2).toBe("FR");
        expect(rec?.name).toBe("France");
    });

    it("returns the matching CountryRecord by name", () => {
        expect(lookup("Türkiye")?.iso3).toBe("TUR");
        expect(lookup("Türkiye")?.iso2).toBe("TR");
    });

    it("returns undefined for unknown input", () => {
        expect(lookup("Atlantis")).toBeUndefined();
    });
});

describe("sanitize (exported)", () => {
    it("applies the documented transforms", () => {
        expect(sanitize("Côte d'Ivoire")).toBe("cote divoire");
        expect(sanitize("the United States of America")).toBe("united states of america");
        expect(sanitize("Trinidad & Tobago")).toBe("trinidad and tobago");
        expect(sanitize("St. Kitts and Nevis")).toBe("saint kitts and nevis");
    });

    it("keeps its source ASCII-only so a mis-decoded bundle still parses", () => {
        const ASCII_UPPER_LIMIT = 127;
        const nonAscii = [...sanitize.toString()].filter((c) => (c.codePointAt(0) ?? 0) > ASCII_UPPER_LIMIT);
        expect(nonAscii).toEqual([]);
    });

    it("produces keys consumers can match against the alias index", () => {
        // Every COUNTRIES record's sanitized name should match its iso3 via lookup.
        for (const c of COUNTRIES) {
            expect(lookupAlpha3(sanitize(c.name))).toBe(c.iso3);
        }
    });
});

describe("createLookup", () => {
    const CUSTOM: CountryRecord[] = [
        {
            iso3: "XAC",
            iso2: "",
            m49: "",
            name: "Aksai Chin",
            aliases: [],
        },
        {
            iso3: "XJK",
            iso2: "",
            m49: "",
            name: "Jammu and Kashmir",
            aliases: [],
        },
    ];

    it("builds a scoped lookup over the supplied records only", () => {
        const custom = createLookup(CUSTOM);
        expect(custom.lookupAlpha3("XAC")).toBe("XAC");
        expect(custom.lookup("Aksai Chin")?.iso3).toBe("XAC");
        // FRA is in COUNTRIES but not in CUSTOM, so it shouldn't resolve here.
        expect(custom.lookupAlpha3("FRA")).toBeUndefined();
        expect(custom.lookupAlpha3("France")).toBeUndefined();
    });

    it("composes with the bundled COUNTRIES dataset via spread", () => {
        const merged = createLookup([...COUNTRIES, ...CUSTOM]);
        expect(merged.lookupAlpha3("FRA")).toBe("FRA");
        expect(merged.lookupAlpha3("France")).toBe("FRA");
        expect(merged.lookupAlpha3("XAC")).toBe("XAC");
        expect(merged.lookup("Aksai Chin")?.iso3).toBe("XAC");
    });

    it("excludes blank iso2 / m49 from the lookup maps", () => {
        const custom = createLookup(CUSTOM);
        expect(custom.byAlpha2.get("")).toBeUndefined();
        expect(custom.byM49.get("")).toBeUndefined();
        expect(custom.byAlpha3.get("XAC")?.name).toBe("Aksai Chin");
    });

    it("throws on cross-country alias collisions", () => {
        const collide: CountryRecord[] = [
            { iso3: "XX1", iso2: "", m49: "", name: "Atlantis", aliases: [] },
            { iso3: "XX2", iso2: "", m49: "", name: "Atlantis", aliases: [] },
        ];
        expect(() => createLookup(collide)).toThrow(/Duplicate name\/alias/);
    });

    it("does not affect the default top-level lookup", () => {
        // Build a scoped lookup with conflicting records — top-level must remain pristine.
        createLookup(CUSTOM);
        expect(lookupAlpha3("XAC")).toBeUndefined();
        expect(lookupAlpha3("Aksai Chin")).toBeUndefined();
    });
});

describe("lookup tables", () => {
    it("byAlpha3 is keyed by iso3", () => {
        expect(byAlpha3.get("FRA")?.name).toBe("France");
        expect(byAlpha3.get("USA")?.iso2).toBe("US");
    });

    it("byAlpha2 is keyed by iso2", () => {
        expect(byAlpha2.get("FR")?.iso3).toBe("FRA");
        expect(byAlpha2.get("US")?.iso3).toBe("USA");
    });

    it("byM49 is keyed by 3-digit padded M49", () => {
        expect(byM49.get("250")?.iso3).toBe("FRA");
        expect(byM49.get("004")?.iso3).toBe("AFG");
    });
});

describe("COUNTRIES table integrity", () => {
    it("has unique iso3 codes", () => {
        const codes = COUNTRIES.map((c) => c.iso3);
        expect(new Set(codes).size).toBe(codes.length);
    });

    it("every record round-trips through lookupAlpha3 by iso3", () => {
        for (const c of COUNTRIES) {
            expect(lookupAlpha3(c.iso3)).toBe(c.iso3);
        }
    });

    it("every record round-trips through lookupAlpha3 by iso2", () => {
        for (const c of COUNTRIES) {
            expect(lookupAlpha3(c.iso2)).toBe(c.iso3);
        }
    });

    it("every record round-trips through lookupAlpha3 by m49", () => {
        for (const c of COUNTRIES) {
            expect(lookupAlpha3(c.m49)).toBe(c.iso3);
        }
    });

    it("every record name round-trips through lookupAlpha3", () => {
        for (const c of COUNTRIES) {
            expect(lookupAlpha3(c.name)).toBe(c.iso3);
        }
    });
});

describe("United Kingdom aliases", () => {
    const gbrAliases = [
        "Britain",
        "England",
        "Great Britain",
        "Northern Ireland",
        "Scotland",
        "the UK",
        "the United Kingdom of Great Britain and Northern Ireland",
        "the United Kingdom",
        "United Kingdom of Great Britain and Northern Ireland",
        "United Kingdom",
        "UK",
        "Wales",
    ];

    for (const input of gbrAliases) {
        it(`"${input}" resolves to GBR`, () => {
            expect(lookupAlpha3(input)).toBe("GBR");
        });
    }
});

// Inputs whose shape matches a code regex but the code lookup misses should
// fall through to the alias index. "UK" is alpha-2-shaped but is not the
// alpha-2 of any country (GBR's alpha-2 is GB); it's an alias.
describe("code-shape fall-through to alias lookup", () => {
    it('"UK" (alpha-2-shaped) falls through and resolves via alias', () => {
        expect(lookupAlpha3("UK")).toBe("GBR");
    });

    it('lowercase "uk" also resolves', () => {
        expect(lookupAlpha3("uk")).toBe("GBR");
    });

    it("unknown alpha-2 shapes still return undefined when no alias matches", () => {
        expect(lookupAlpha3("ZQ")).toBeUndefined();
    });
});

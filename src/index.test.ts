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

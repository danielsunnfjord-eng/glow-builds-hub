import { describe, expect, it } from "vitest";
import { HOME_COPY, HOME_TESTIMONIAL_AUTHORS } from "./homeCopy";
import { GROUP_INTAKE_URL, isGroupPageAvailable } from "@/lib/travelNavigation";

describe("homepage rules", () => {
  it("group intake link is the Groups and Corporate form", () => {
    expect(GROUP_INTAKE_URL).toBe("https://secure.foratravel.com/intake/98VwtEFIcy");
  });
  it("no visible homepage text contains square brackets", () => {
    const strings = (v: unknown): string[] =>
      typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];
    for (const s of strings(HOME_COPY)) expect(s).not.toMatch(/[[\]]/);
  });
  it("final call promises a reply within one business day", () => {
    expect(HOME_COPY.en.finalTitle).toBe("Tell us about your group. I reply within one business day.");
  });
  it("homepage shows only the two Rio testimonials", () => {
    expect(HOME_TESTIMONIAL_AUTHORS).toEqual(["Ingeborg Sol Fure", "Åge Avedal"]);
  });
  it("unfinished group pages are hidden on the published site but open in preview", () => {
    expect(isGroupPageAvailable("folkHighSchools", true)).toBe(false);
    expect(isGroupPageAvailable("folkHighSchools", false)).toBe(true);
  });
});

import { RIO_TESTIMONIAL_AUTHORS, ROME_TESTIMONIAL_AUTHORS } from "./homeCopy";
import { GROUP_REFERENCES_ENABLED } from "../GroupReferences";
describe("testimonial placement", () => {
  it("group pages show only the Rio reviews", () => {
    expect(RIO_TESTIMONIAL_AUTHORS).toEqual(["Ingeborg Sol Fure", "Åge Avedal"]);
  });
  it("Rome review is kept out of the homepage", () => {
    expect(HOME_TESTIMONIAL_AUTHORS).not.toContain(ROME_TESTIMONIAL_AUTHORS[0]);
  });
  it("group references stay hidden", () => {
    expect(GROUP_REFERENCES_ENABLED).toBe(false);
  });
});

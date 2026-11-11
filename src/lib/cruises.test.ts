import { describe, expect, it } from "vitest";
import { localePath } from "./locale";
import { PRIVATE_INTAKE_URL, isPrivateTravelPath } from "./travelNavigation";

describe("cruise destinations", () => {
  it("uses the supplied private cruise intake", () => {
    expect(PRIVATE_INTAKE_URL).toBe("https://secure.foratravel.com/intake/uRYFCpSsUZ");
  });
  it.each(["/cruises", "/cruise", "/cruzeiros"])("maps %s across all languages", (path) => {
    expect(localePath(path, "en")).toBe("/cruises");
    expect(localePath(path, "no")).toBe("/no/cruise");
    expect(localePath(path, "pt")).toBe("/pt-br/cruzeiros");
  });
  it.each(["/cruises", "/cruise", "/cruzeiros"])("keeps %s in private travel", path => {
    expect(isPrivateTravelPath(path)).toBe(true);
  });
});
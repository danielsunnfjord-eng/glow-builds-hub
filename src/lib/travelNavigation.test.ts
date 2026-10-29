import { describe, expect, it } from "vitest";
import { localePath } from "./locale";
import { GROUP_INTAKE_URL, PRIVATE_INTAKE_URL, isPrivateTravelPath } from "./travelNavigation";

describe("travel enquiry destinations", () => {
  it("uses the provided group and corporate intake", () => {
    expect(GROUP_INTAKE_URL).toBe("https://secure.foratravel.com/intake/98VwtEFIcy");
  });
  it("uses the provided private intake", () => {
    expect(PRIVATE_INTAKE_URL).toBe("https://secure.foratravel.com/intake/uRYFCpSsUZ");
  });
  it.each(["/private-travel", "/catalogue", "/catalogue/example", "/pricing", "/start-your-journey", "/plan-my-trip"])("retains private enquiry access on %s", (path) => {
    expect(isPrivateTravelPath(path)).toBe(true);
  });
  it.each(["/corporate", "/bedrift", "/folkehogskole", "/sports-and-surf", "/safety"])("does not classify %s as private", (path) => {
    expect(isPrivateTravelPath(path)).toBe(false);
  });
});

describe("localized routes", () => {
  it.each([
    ["/folkehogskole", "/no/folkehogskole"],
    ["/sports-and-surf", "/no/idrett-og-surf"],
    ["/corporate", "/no/bedrift"],
    ["/safety", "/no/trygghet"],
    ["/groups", "/no/grupper"],
    ["/start", "/no/kom-i-gang"],
    ["/trips", "/no/reiser"],
  ])("maps %s to %s", (path, norwegian) => {
    expect(localePath(path, "no")).toBe(norwegian);
    const stripped = norwegian.slice(3);
    expect(localePath(stripped, "en")).toBe(path);
    expect(localePath(stripped, "pt")).toBe(`/pt-br${path}`);
  });
  it.each(["/catalogue", "/pricing", "/about", "/start-your-journey", "/privacy", "/terms", "/destinations/norway"])("preserves existing %s URLs", (path) => {
    expect(localePath(path, "en")).toBe(path);
    expect(localePath(path, "no")).toBe(`/no${path}`);
    expect(localePath(path, "pt")).toBe(`/pt-br${path}`);
  });
});
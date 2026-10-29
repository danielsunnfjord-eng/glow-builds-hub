import { describe, expect, it } from "vitest";
import { GROUP_ENTRIES, START_CHOICES } from "./conciergeCopy";
import { HOME_COPY } from "@/components/voyage/home/homeCopy";

describe("concierge planning destinations", () => {
  it("private planning opens the owner's private intake in a new tab", () => {
    expect(START_CHOICES[0]).toEqual({ key: "privateChoice", href: "https://secure.foratravel.com/intake/uRYFCpSsUZ", external: true });
  });
  it("group planning opens the owner's groups intake in a new tab", () => {
    expect(START_CHOICES[1]).toEqual({ key: "groupChoice", href: "https://secure.foratravel.com/intake/98VwtEFIcy", external: true });
  });
  it("themed departures stay on the trips page", () => {
    expect(START_CHOICES[2]).toEqual({ key: "themeChoice", href: "/trips", external: false });
  });
  it("school and club hub retains access to both existing audience pages", () => {
    expect(GROUP_ENTRIES.map((entry) => entry.href)).toEqual(["/folkehogskole", "/sports-and-surf"]);
  });
  it("all four homepage divisions use the requested destination pages", () => {
    for (const locale of ["en", "no", "pt"] as const) {
      expect(HOME_COPY[locale].cards.map((card) => card.path)).toEqual(["/private-travel", "/groups", "/corporate", "/trips"]);
    }
  });
});
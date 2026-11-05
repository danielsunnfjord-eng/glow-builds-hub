import { describe, expect, it } from "vitest";
import { THEME_COPY, THEME_TRIPS, themeTripBySlug, availableTripPeriods } from "./themeTrips";
import { localizedRoutePath } from "./locale";

describe("theme trips data", () => {
  it("keeps existing trips and puts new trips in the supplied order", () => {
    expect(THEME_TRIPS.map((t) => t.slug)).toEqual(["rio-carnaval-experience", "rio-flow-experience", "norway-surf-fjord-week", "sogn-og-fjordane-fjords", "beach-sports-camp-rio"]);
  });

  it("uses only the supplied tentative periods for each trip", () => {
    expect(themeTripBySlug("rio-flow-experience")?.copy.en.periods).toEqual([
      "June to August 2027",
      "September to October 2027",
      "December 2027 to January 2028",
    ]);
    expect(themeTripBySlug("norway-surf-fjord-week")?.copy.en.periods).toEqual(["June to August 2027"]);
    expect(themeTripBySlug("beach-sports-camp-rio")?.copy.no.periods).toEqual(["juni til august 2027", "september til oktober 2027"]);
  });

  it("does not define any trip prices", () => {
    for (const trip of THEME_TRIPS) {
      expect(trip).not.toHaveProperty("price");
      for (const locale of ["en", "no", "pt"] as const) expect(trip.copy[locale]).not.toHaveProperty("price");
    }
  });

  it("keeps the interest-list status tag in every language", () => {
    expect(THEME_COPY.en.statusTag).toBe("Interest list");
    expect(THEME_COPY.no.statusTag).toBe("Interesseliste");
  });

  it("maps trip detail URLs between English and Norwegian", () => {
    expect(localizedRoutePath("/trips/rio-flow-experience", "no")).toBe("/reiser/rio-flow-experience");
    expect(localizedRoutePath("/trips/rio-flow-experience", "en")).toBe("/trips/rio-flow-experience");
  });

  it("maps both new Norwegian URLs in both directions", () => {
    expect(localizedRoutePath("/trips/rio-carnaval-experience", "no")).toBe("/reiser/rio-karneval");
    expect(localizedRoutePath("/reiser/rio-karneval", "en")).toBe("/trips/rio-carnaval-experience");
    expect(localizedRoutePath("/trips/sogn-og-fjordane-fjords", "no")).toBe("/reiser/sogn-og-fjordane-fjordene");
    expect(localizedRoutePath("/reiser/sogn-og-fjordane-fjordene", "pt")).toBe("/trips/sogn-og-fjordane-fjords");
    expect(themeTripBySlug("rio-karneval")?.slug).toBe("rio-carnaval-experience");
    expect(themeTripBySlug("sogn-og-fjordane-fjordene")?.slug).toBe("sogn-og-fjordane-fjords");
  });

  it("has ten Carnaval days and seven Sognefjord days", () => {
    expect(themeTripBySlug("rio-carnaval-experience")?.copy.en.program).toHaveLength(10);
    expect(themeTripBySlug("sogn-og-fjordane-fjords")?.copy.en.program).toHaveLength(7);
    expect(themeTripBySlug("sogn-og-fjordane-fjords")?.copy.en.periods).toEqual(["June to August 2027"]);
  });

  it("closes February 2027 at the end of 5 December 2026 Oslo time", () => {
    const trip = themeTripBySlug("rio-carnaval-experience");
    if (!trip) throw new Error("Missing Carnaval trip");
    expect(availableTripPeriods(trip, "en", new Date("2026-12-05T22:59:59.999Z"))).toEqual(["February 2027", "February 2028"]);
    expect(availableTripPeriods(trip, "en", new Date("2026-12-05T23:00:00.000Z"))).toEqual(["February 2028"]);
  });

  it("closes February 2028 at the end of 1 November 2027 Oslo time", () => {
    const trip = themeTripBySlug("rio-carnaval-experience");
    if (!trip) throw new Error("Missing Carnaval trip");
    expect(availableTripPeriods(trip, "no", new Date("2027-11-01T22:59:59.999Z"))).toEqual(["februar 2028"]);
    expect(availableTripPeriods(trip, "no", new Date("2027-11-01T23:00:00.000Z"))).toEqual([]);
  });
});

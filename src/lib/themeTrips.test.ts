import { describe, expect, it } from "vitest";
import { THEME_COPY, THEME_TRIPS, themeTripBySlug } from "./themeTrips";
import { localizedRoutePath } from "./locale";

describe("theme trips data", () => {
  it("has exactly the three supplied trips", () => {
    expect(THEME_TRIPS.map((t) => t.slug)).toEqual(["rio-flow-experience", "norway-surf-fjord-week", "beach-sports-camp-rio"]);
  });

  it("uses only the supplied tentative periods for each trip", () => {
    expect(themeTripBySlug("rio-flow-experience")!.copy.en.periods).toEqual([
      "June to August 2027",
      "September to October 2027",
      "December 2027 to January 2028",
    ]);
    expect(themeTripBySlug("norway-surf-fjord-week")!.copy.en.periods).toEqual(["June to August 2027"]);
    expect(themeTripBySlug("beach-sports-camp-rio")!.copy.no.periods).toEqual(["juni til august 2027", "september til oktober 2027"]);
  });

  it("never mentions a price anywhere in the trip copy", () => {
    for (const trip of THEME_TRIPS) {
      for (const locale of ["en", "no", "pt"] as const) {
        const text = JSON.stringify(trip.copy[locale]).toLowerCase();
        expect(text).not.toMatch(/price|pris|preço|from €|from nok/);
      }
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
});

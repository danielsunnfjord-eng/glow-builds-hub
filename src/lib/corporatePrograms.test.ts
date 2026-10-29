import { describe, expect, it } from "vitest";
import { CORPORATE_PROGRAMS } from "./corporatePrograms";

describe.each(["en", "no"] as const)("corporate sample durations (%s)", (locale) => {
  it("offers a three-day fjord team trip", () => {
    expect(CORPORATE_PROGRAMS[locale][0].days).toHaveLength(3);
  });
  it("offers a five-day Rio incentive trip", () => {
    expect(CORPORATE_PROGRAMS[locale][1].days).toHaveLength(5);
  });
});
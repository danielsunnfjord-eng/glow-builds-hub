import { afterEach, describe, expect, it, vi } from "vitest";
import { interestSignupSchema, INTEREST_AUDIENCES } from "./interestSignup";

const valid = { trip: "rio-flow-experience", locale: "en", name: "Test traveler", email: "test@example.com", period: "June to August 2027", number_of_people: 6, audience: "club", consent: true };

describe("trip interest requirements", () => {
  afterEach(() => vi.useRealTimers());
  it("rejects expired February 2027 interest on the shared server schema", () => {
    vi.useFakeTimers();
    const carnaval = { ...valid, trip: "rio-carnaval-experience", period: "February 2027" };
    vi.setSystemTime(new Date("2026-12-05T22:59:59.999Z"));
    expect(interestSignupSchema.safeParse(carnaval).success).toBe(true);
    vi.setSystemTime(new Date("2026-12-05T23:00:00.000Z"));
    expect(interestSignupSchema.safeParse(carnaval).success).toBe(false);
    expect(interestSignupSchema.safeParse({ ...carnaval, period: "February 2028" }).success).toBe(true);
  });
  it("rejects all Carnaval interest after the final Oslo deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-11-01T23:00:00.000Z"));
    expect(interestSignupSchema.safeParse({ ...valid, trip: "rio-carnaval-experience", period: "February 2028" }).success).toBe(false);
  });
  it("accepts both supplied new trips and their exact Norwegian periods", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-05T12:28:00Z"));
    expect(interestSignupSchema.safeParse({ ...valid, trip: "rio-carnaval-experience", locale: "no", period: "februar 2027" }).success).toBe(true);
    expect(interestSignupSchema.safeParse({ ...valid, trip: "sogn-og-fjordane-fjords", locale: "no", period: "juni til august 2027" }).success).toBe(true);
  });
  it("requires name", () => expect(interestSignupSchema.safeParse({ ...valid, name: " " }).success).toBe(false));
  it("requires valid email", () => expect(interestSignupSchema.safeParse({ ...valid, email: "invalid" }).success).toBe(false));
  it("allows an omitted phone", () => expect(interestSignupSchema.safeParse(valid).success).toBe(true));
  it("allows an omitted message", () => expect(interestSignupSchema.parse(valid).message).toBeUndefined());
  it("requires a positive whole number of people", () => {
    for (const number_of_people of [undefined, 0, -1, 1.5]) expect(interestSignupSchema.safeParse({ ...valid, number_of_people }).success).toBe(false);
    expect(interestSignupSchema.parse(valid).number_of_people).toBe(6);
  });
  it("allows exactly the four supplied audiences", () => {
    expect(INTEREST_AUDIENCES).toEqual(["individual", "school", "club", "company"]);
    for (const audience of INTEREST_AUDIENCES) expect(interestSignupSchema.safeParse({ ...valid, audience }).success).toBe(true);
    expect(interestSignupSchema.safeParse({ ...valid, audience: "other" }).success).toBe(false);
  });
  it("requires explicit consent", () => {
    for (const consent of [false, undefined, "true"]) expect(interestSignupSchema.safeParse({ ...valid, consent }).success).toBe(false);
  });
  it("accepts only the trip's listed period in the submitted language", () => {
    expect(interestSignupSchema.safeParse({ ...valid, period: "Tomorrow" }).success).toBe(false);
    expect(interestSignupSchema.safeParse({ ...valid, locale: "no" }).success).toBe(false);
    expect(interestSignupSchema.safeParse({ ...valid, locale: "no", period: "juni til august 2027" }).success).toBe(true);
  });
  it("rejects unknown trips and oversized input", () => {
    expect(interestSignupSchema.safeParse({ ...valid, trip: "unknown" }).success).toBe(false);
    expect(interestSignupSchema.safeParse({ ...valid, message: "x".repeat(2001) }).success).toBe(false);
  });
});
import { describe, expect, it } from "vitest";
import { themeWishSchema, THEME_WISH_OWNER_EMAIL } from "./themeWish";

const valid = { name: "Traveler", email: "test@example.com", wish: "A surf and music trip", locale: "en", consent: true };
describe("theme travel wishes", () => {
  it("requires a travel wish", () => expect(themeWishSchema.safeParse({ ...valid, wish: " " }).success).toBe(false));
  it("requires contact details", () => {
    expect(themeWishSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
    expect(themeWishSchema.safeParse({ ...valid, email: "invalid" }).success).toBe(false);
  });
  it("requires privacy consent", () => expect(themeWishSchema.safeParse({ ...valid, consent: false }).success).toBe(false));
  it("accepts all three site languages", () => {
    for (const locale of ["en", "no", "pt"]) expect(themeWishSchema.safeParse({ ...valid, locale }).success).toBe(true);
    expect(themeWishSchema.safeParse({ ...valid, locale: "fr" }).success).toBe(false);
  });
  it("limits wish length", () => expect(themeWishSchema.safeParse({ ...valid, wish: "x".repeat(2001) }).success).toBe(false));
  it("sends to the owner's existing Fora email", () => expect(THEME_WISH_OWNER_EMAIL).toBe("daniel.lirafigueiredo@fora.travel"));
});
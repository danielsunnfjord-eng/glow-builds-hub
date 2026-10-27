import { describe, expect, it } from "vitest";
import LocalHostsNorway from "./LocalHostsNorway";

describe("unconfirmed Norway suppliers", () => {
  it("keeps the local-hosts block hidden until suppliers are confirmed", () => {
    expect(LocalHostsNorway()).toBeNull();
  });
});
// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { htmlToMarkdown, markdownToHtml } from "./markdownHelpers";

describe("markdown helpers runtime compatibility", () => {
  it("can be imported and render markdown without a browser during SSR", () => {
    expect(typeof window).toBe("undefined");
    expect(markdownToHtml("## Day 1\n\nWelcome")).toBe("<h2>Day 1</h2><p>Welcome</p>");
  });

  it("still converts editor content using the browser document", () => {
    const dom = new JSDOM("");
    vi.stubGlobal("document", dom.window.document);
    try {
      expect(htmlToMarkdown("<h2>Day 1</h2><p>Welcome</p>")).toBe("## Day 1\n\nWelcome");
      expect(htmlToMarkdown('<img src="https://example.com/photo.jpg" alt="Rio" title="Daniel">')).toBe('![Rio](https://example.com/photo.jpg "Daniel")');
    } finally {
      vi.unstubAllGlobals();
      dom.window.close();
    }
  });
});
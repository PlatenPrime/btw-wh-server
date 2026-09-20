import { describe, expect, it } from "vitest";
import {
  TELEGRAM_MESSAGE_MAX_CHARS,
  chunkTelegramMessage,
} from "../chunkTelegramMessage.js";

describe("chunkTelegramMessage", () => {
  it("returns the original text when within the limit", () => {
    expect(chunkTelegramMessage("short")).toEqual(["short"]);
  });

  it("keeps empty string as a single chunk", () => {
    expect(chunkTelegramMessage("")).toEqual([""]);
  });

  it("splits on newlines and prefixes (i/n)", () => {
    const maxLen = 40;
    const text = `${"a".repeat(20)}\n${"b".repeat(20)}`;
    expect(text.length).toBeGreaterThan(maxLen);

    const chunks = chunkTelegramMessage(text, maxLen);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0]).toMatch(/^\(1\/\d+\)\n/);
    expect(chunks[1]).toMatch(/^\(2\/\d+\)\n/);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(maxLen);
    }
    const bodies = chunks.map((c) => c.replace(/^\(\d+\/\d+\)\n/, "")).join("\n");
    expect(bodies).toContain("a".repeat(20));
    expect(bodies).toContain("b".repeat(20));
  });

  it("hard-splits a single line longer than the limit", () => {
    const text = "x".repeat(50);
    const chunks = chunkTelegramMessage(text, 20);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(20);
    }
    const joined = chunks.map((c) => c.replace(/^\(\d+\/\d+\)\n/, "")).join("");
    expect(joined).toBe(text);
  });

  it("default limit is Telegram 4096", () => {
    const text = "y".repeat(TELEGRAM_MESSAGE_MAX_CHARS);
    expect(chunkTelegramMessage(text)).toEqual([text]);
    expect(chunkTelegramMessage(`${text}z`).length).toBeGreaterThan(1);
    for (const chunk of chunkTelegramMessage(`${text}z`)) {
      expect(chunk.length).toBeLessThanOrEqual(TELEGRAM_MESSAGE_MAX_CHARS);
    }
  });

  it("rejects non-positive maxLen", () => {
    expect(() => chunkTelegramMessage("a", 0)).toThrow(/maxLen/);
  });
});

import { describe, expect, it } from "vitest";
import { summarizeAirHtmlForLog } from "../summarizeAirHtmlForLog.js";
describe("summarizeAirHtmlForLog", () => {
    it("достаёт title и ужимает snippet", () => {
        const html = `<html><head><title>  Too Many\nRequests  </title></head><body>${"x".repeat(300)}</body></html>`;
        const out = summarizeAirHtmlForLog(html);
        expect(out.title).toBe("Too Many Requests");
        expect(out.snippet.length).toBeLessThanOrEqual(160);
        expect(out.htmlLength).toBe(html.length);
    });
    it("пустой title если тега нет", () => {
        expect(summarizeAirHtmlForLog("<html></html>").title).toBe("");
    });
});

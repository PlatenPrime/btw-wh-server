import { describe, expect, it } from "vitest";
import { formatExcelDateHeaderUk } from "../formatExcelDateHeaderUk.js";
describe("formatExcelDateHeaderUk", () => {
    it("includes YYYY-MM-DD in UTC and Ukrainian weekday for Friday 2026-04-03", () => {
        const s = formatExcelDateHeaderUk(new Date("2026-04-03T00:00:00.000Z"));
        expect(s).toContain("2026-04-03");
        expect(s.toLowerCase()).toMatch(/^[^,]+,\s*2026-04-03$/);
        expect(s.toLowerCase()).toMatch(/п.*ятниця/);
    });
    it("includes Thursday for 2026-04-09", () => {
        const s = formatExcelDateHeaderUk(new Date("2026-04-09T00:00:00.000Z"));
        expect(s).toContain("2026-04-09");
        expect(s.toLowerCase()).toContain("четвер");
    });
});

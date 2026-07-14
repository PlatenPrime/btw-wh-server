import { describe, expect, it } from "vitest";
import { runCompensatingSliceSchema } from "../runCompensatingSliceSchema.js";
describe("runCompensatingSliceSchema", () => {
    it("normalizes konkName", () => {
        const r = runCompensatingSliceSchema.safeParse({ konkName: " Air " });
        expect(r.success).toBe(true);
        if (r.success) {
            expect(r.data.konkName).toBe("air");
        }
    });
    it("rejects missing konkName", () => {
        const r = runCompensatingSliceSchema.safeParse({});
        expect(r.success).toBe(false);
    });
    it("rejects empty konkName", () => {
        const r = runCompensatingSliceSchema.safeParse({ konkName: "   " });
        expect(r.success).toBe(false);
    });
});

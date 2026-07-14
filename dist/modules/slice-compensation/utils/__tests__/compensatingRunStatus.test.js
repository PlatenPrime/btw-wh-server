import { afterEach, describe, expect, it } from "vitest";
import { clearCompensatingRunsForTests, isCompensatingRunActive, releaseCompensatingRun, tryAcquireCompensatingRun, } from "../compensatingRunStatus.js";
describe("compensatingRunStatus", () => {
    afterEach(() => {
        clearCompensatingRunsForTests();
    });
    it("acquires lock for a konk", () => {
        expect(tryAcquireCompensatingRun("Air")).toBe(true);
        expect(isCompensatingRunActive("air")).toBe(true);
    });
    it("rejects second acquire for same konk (case-insensitive)", () => {
        expect(tryAcquireCompensatingRun("air")).toBe(true);
        expect(tryAcquireCompensatingRun("AIR")).toBe(false);
    });
    it("allows acquire for different konk", () => {
        expect(tryAcquireCompensatingRun("air")).toBe(true);
        expect(tryAcquireCompensatingRun("balun")).toBe(true);
    });
    it("allows re-acquire after release", () => {
        expect(tryAcquireCompensatingRun("air")).toBe(true);
        releaseCompensatingRun("air");
        expect(tryAcquireCompensatingRun("air")).toBe(true);
    });
    it("rejects empty/whitespace konk", () => {
        expect(tryAcquireCompensatingRun("   ")).toBe(false);
    });
});

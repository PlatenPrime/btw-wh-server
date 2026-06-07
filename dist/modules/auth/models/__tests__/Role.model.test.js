import { beforeEach, describe, expect, it } from "vitest";
import Role from "../Role.js";
describe("Role Model", () => {
    beforeEach(async () => {
        await Role.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should save role with value and name", async () => {
            const saved = await Role.create({
                value: "ADMIN",
                name: "Administrator",
            });
            expect(saved.value).toBe("ADMIN");
            expect(saved.name).toBe("Administrator");
        });
        it("should enforce unique value", async () => {
            await Role.create({ value: "USER", name: "User" });
            await expect(Role.create({ value: "USER", name: "Duplicate" })).rejects.toThrow();
        });
        it("should default value to USER when omitted", async () => {
            const saved = await Role.create({ name: "Default role" });
            expect(saved.value).toBe("USER");
        });
    });
});

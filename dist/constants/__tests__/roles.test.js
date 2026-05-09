import { describe, expect, it } from "vitest";
import { hasRoleAccess, isValidRole, RoleType, ROLE_HIERARCHY, } from "../roles.js";
describe("ROLE_HIERARCHY", () => {
    it("содержит четыре уровня в порядке PRIME > ADMIN > EDITOR > USER", () => {
        expect(ROLE_HIERARCHY[RoleType.PRIME]).toBeGreaterThan(ROLE_HIERARCHY[RoleType.ADMIN]);
        expect(ROLE_HIERARCHY[RoleType.ADMIN]).toBeGreaterThan(ROLE_HIERARCHY[RoleType.EDITOR]);
        expect(ROLE_HIERARCHY[RoleType.EDITOR]).toBeGreaterThan(ROLE_HIERARCHY[RoleType.USER]);
    });
});
describe("isValidRole", () => {
    it("принимает EDITOR", () => {
        expect(isValidRole("EDITOR")).toBe(true);
    });
});
describe("hasRoleAccess", () => {
    it("EDITOR имеет доступ к требованию USER", () => {
        expect(hasRoleAccess(RoleType.EDITOR, RoleType.USER)).toBe(true);
    });
    it("EDITOR не имеет доступа к требованию ADMIN", () => {
        expect(hasRoleAccess(RoleType.EDITOR, RoleType.ADMIN)).toBe(false);
    });
    it("ADMIN имеет доступ к требованию EDITOR", () => {
        expect(hasRoleAccess(RoleType.ADMIN, RoleType.EDITOR)).toBe(true);
    });
    it("USER не имеет доступа к требованию EDITOR", () => {
        expect(hasRoleAccess(RoleType.USER, RoleType.EDITOR)).toBe(false);
    });
});

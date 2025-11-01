import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import Role from "../../../../models/Role.js";
import { getAllRolesUtil } from "../getAllRolesUtil.js";

describe("getAllRolesUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает пустой массив если ролей нет", async () => {
    const roles = await getAllRolesUtil();

    expect(roles).toEqual([]);
  });

  it("возвращает все роли", async () => {
    await Role.create({ value: "USER", name: "User" });
    await Role.create({ value: "ADMIN", name: "Admin" });

    const roles = await getAllRolesUtil();

    expect(roles.length).toBe(2);
    expect(roles.some((r) => r.value === "USER")).toBe(true);
    expect(roles.some((r) => r.value === "ADMIN")).toBe(true);
  });
});


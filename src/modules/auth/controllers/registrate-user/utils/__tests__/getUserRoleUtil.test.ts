import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import Role from "../../../../models/Role.js";
import { getUserRoleUtil } from "../getUserRoleUtil.js";

describe("getUserRoleUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает дефолтную роль USER если роль не передана", async () => {
    const role = await getUserRoleUtil();

    expect(role).toBe("USER");
  });

  it("возвращает дефолтную роль USER если роль не найдена", async () => {
    const role = await getUserRoleUtil("NONEXISTENT");

    expect(role).toBe("USER");
  });

  it("возвращает найденную роль если она существует", async () => {
    const testRole = await Role.create({ value: "ADMIN", name: "Admin" });

    const role = await getUserRoleUtil("ADMIN");

    expect(role).toBe("ADMIN");
  });

  it("возвращает EDITOR если роль есть в коллекции", async () => {
    await Role.create({ value: "EDITOR", name: "Editor" });

    const role = await getUserRoleUtil("EDITOR");

    expect(role).toBe("EDITOR");
  });
});


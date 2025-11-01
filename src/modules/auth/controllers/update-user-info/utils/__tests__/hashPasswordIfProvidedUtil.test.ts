import { describe, expect, it } from "vitest";
import { hashPasswordIfProvidedUtil } from "../hashPasswordIfProvidedUtil.js";

describe("hashPasswordIfProvidedUtil", () => {
  it("хеширует пароль если он передан", () => {
    const updateData = {
      password: "newPassword123",
      fullname: "New Name",
    };

    const result = hashPasswordIfProvidedUtil(updateData);

    expect(result.password).toBeTruthy();
    expect(result.password).not.toBe("newPassword123");
    expect(result.fullname).toBe("New Name");
  });

  it("не изменяет данные если пароль не передан", () => {
    const updateData = {
      fullname: "New Name",
      role: "ADMIN",
    };

    const result = hashPasswordIfProvidedUtil(updateData);

    expect(result).toEqual(updateData);
    expect(result.password).toBeUndefined();
  });

  it("сохраняет все остальные поля", () => {
    const updateData = {
      password: "newPassword123",
      fullname: "New Name",
      role: "ADMIN",
      telegram: "@newuser",
    };

    const result = hashPasswordIfProvidedUtil(updateData);

    expect(result.fullname).toBe("New Name");
    expect(result.role).toBe("ADMIN");
    expect(result.telegram).toBe("@newuser");
    expect(result.password).not.toBe("newPassword123");
  });
});


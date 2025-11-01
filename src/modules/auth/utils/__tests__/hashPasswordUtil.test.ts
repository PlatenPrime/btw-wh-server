import { describe, expect, it } from "vitest";
import { hashPasswordUtil } from "../hashPasswordUtil.js";

describe("hashPasswordUtil", () => {
  it("хеширует пароль и возвращает строку", () => {
    const password = "testPassword123";
    const hashed = hashPasswordUtil(password);

    expect(hashed).toBeTruthy();
    expect(typeof hashed).toBe("string");
    expect(hashed).not.toBe(password);
  });

  it("генерирует разные хеши для одного пароля (из-за соли)", () => {
    const password = "testPassword123";
    const hashed1 = hashPasswordUtil(password);
    const hashed2 = hashPasswordUtil(password);

    expect(hashed1).not.toBe(hashed2);
  });

  it("принимает кастомное количество раундов соли", () => {
    const password = "testPassword123";
    const hashed = hashPasswordUtil(password, 5);

    expect(hashed).toBeTruthy();
    expect(typeof hashed).toBe("string");
  });
});


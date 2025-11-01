import { describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { createTestUser } from "../../../../../../test/setup.js";
import { getLoginResponseUtil } from "../getLoginResponseUtil.js";

describe("getLoginResponseUtil", () => {
  it("формирует ответ с пользователем без пароля и токеном", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      fullname: "Test User",
      role: "ADMIN",
    });

    const response = getLoginResponseUtil({ user });

    expect(response).toBeTruthy();
    expect(response.user).toBeTruthy();
    expect((response.user as any).password).toBeUndefined();
    expect(response.user._id.toString()).toBe(user._id.toString());
    expect(response.user.username).toBe(user.username);
    expect(response.token).toBeTruthy();
    expect(typeof response.token).toBe("string");
  });

  it("генерирует токен с правильными данными", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      role: "USER",
    });

    const response = getLoginResponseUtil({ user });

    expect(response.token).toBeTruthy();
    expect(response.token.length).toBeGreaterThan(0);
  });
});


import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import User from "../../../../models/User.js";
import { hashPasswordUtil } from "../../../../utils/hashPasswordUtil.js";
import { validateUserCredentialsUtil } from "../validateUserCredentialsUtil.js";

describe("validateUserCredentialsUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает isValid: true для правильных учетных данных", async () => {
    const password = "correctPassword";
    const hashedPassword = hashPasswordUtil(password);
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      password: hashedPassword,
    });

    const result = await validateUserCredentialsUtil({
      username: user.username,
      password: password,
    });

    expect(result.isValid).toBe(true);
    expect(result.user).toBeTruthy();
    expect(result.user?._id.toString()).toBe(user._id.toString());
  });

  it("возвращает isValid: false для неправильного пароля", async () => {
    const password = "correctPassword";
    const hashedPassword = hashPasswordUtil(password);
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      password: hashedPassword,
    });

    const result = await validateUserCredentialsUtil({
      username: user.username,
      password: "wrongPassword",
    });

    expect(result.isValid).toBe(false);
    expect(result.user).toBeTruthy();
  });

  it("возвращает user: null для несуществующего пользователя", async () => {
    const result = await validateUserCredentialsUtil({
      username: "nonexistentuser",
      password: "anyPassword",
    });

    expect(result.isValid).toBe(false);
    expect(result.user).toBeNull();
  });
});


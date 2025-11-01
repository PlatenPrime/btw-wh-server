import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import User from "../../models/User.js";
import { getUserWithoutPasswordUtil } from "../getUserWithoutPasswordUtil.js";

describe("getUserWithoutPasswordUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("исключает поле password из объекта пользователя", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      fullname: "Test User",
      password: "password123",
      role: "USER",
    });

    const userWithoutPassword = getUserWithoutPasswordUtil(user);

    expect(userWithoutPassword).toBeTruthy();
    expect((userWithoutPassword as any).password).toBeUndefined();
    expect(userWithoutPassword._id).toBeDefined();
    expect(userWithoutPassword.username).toBe(user.username);
    expect(userWithoutPassword.fullname).toBe(user.fullname);
  });

  it("сохраняет все остальные поля пользователя", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      fullname: "Test User",
      password: "password123",
      role: "ADMIN",
      telegram: "@testuser",
      photo: "photo.jpg",
    });

    const userWithoutPassword = getUserWithoutPasswordUtil(user);

    expect(userWithoutPassword.role).toBe("ADMIN");
    expect(userWithoutPassword.telegram).toBe("@testuser");
    expect(userWithoutPassword.photo).toBe("photo.jpg");
  });
});


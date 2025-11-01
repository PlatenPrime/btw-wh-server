import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { getAllUsersUtil } from "../getAllUsersUtil.js";

describe("getAllUsersUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает пустой массив если пользователей нет", async () => {
    const users = await getAllUsersUtil();

    expect(users).toEqual([]);
  });

  it("возвращает всех пользователей без поля password", async () => {
    await createTestUser({ username: `user1-${Date.now()}` });
    await createTestUser({ username: `user2-${Date.now()}` });

    const users = await getAllUsersUtil();

    expect(users.length).toBe(2);
    users.forEach((user) => {
      expect((user as any).password).toBeUndefined();
      expect(user._id).toBeDefined();
    });
  });
});


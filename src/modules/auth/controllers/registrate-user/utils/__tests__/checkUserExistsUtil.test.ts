import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { checkUserExistsUtil } from "../checkUserExistsUtil.js";

describe("checkUserExistsUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает true если пользователь существует", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
    });

    const exists = await checkUserExistsUtil(user.username);

    expect(exists).toBe(true);
  });

  it("возвращает false если пользователь не существует", async () => {
    const exists = await checkUserExistsUtil("nonexistentuser");

    expect(exists).toBe(false);
  });
});


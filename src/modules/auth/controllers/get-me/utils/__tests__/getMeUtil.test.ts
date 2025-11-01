import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import User from "../../../../models/User.js";
import { getMeUtil } from "../getMeUtil.js";

describe("getMeUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает пользователя по ID", async () => {
    const user = await createTestUser({
      username: `testuser-${Date.now()}`,
      fullname: "Test User",
    });

    const result = await getMeUtil(user._id.toString());

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(user._id.toString());
    expect(result?.username).toBe(user.username);
    expect(result?.fullname).toBe(user.fullname);
  });

  it("возвращает null если пользователь не найден", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const result = await getMeUtil(fakeId);

    expect(result).toBeNull();
  });
});


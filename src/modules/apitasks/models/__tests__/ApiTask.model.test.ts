import { beforeEach, describe, expect, it } from "vitest";
import { ApiTask } from "../ApiTask.js";

describe("ApiTask model", () => {
  beforeEach(async () => {
    await ApiTask.deleteMany({});
  });

  it("saves required fields with defaults", async () => {
    const task = await ApiTask.create({
      userId: "user-1",
      kind: "grabo-skus.sync",
      params: {},
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(task.status).toBe("queued");
    expect(task.phase).toBe("queued");
    expect(task.progress).toBe(0);
    expect(task.createdAt).toBeInstanceOf(Date);
  });

  it("fails without userId", async () => {
    const task = new ApiTask({
      kind: "grabo-skus.sync",
      expiresAt: new Date(),
    });
    await expect(task.save()).rejects.toThrow();
  });

  it("rejects invalid status", async () => {
    const task = new ApiTask({
      userId: "u",
      kind: "grabo-skus.sync",
      status: "nope",
      expiresAt: new Date(),
    });
    await expect(task.save()).rejects.toThrow();
  });
});

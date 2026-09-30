import { describe, expect, it } from "vitest";
import { ApiTask } from "../../models/ApiTask.js";
import { toApiTaskPublicData } from "../toApiTaskPublicData.js";

describe("toApiTaskPublicData", () => {
  it("maps fields including result and error", async () => {
    const task = await ApiTask.create({
      userId: "u1",
      kind: "grabo-skus.sync",
      params: {},
      status: "completed",
      progress: 100,
      message: "Completed",
      result: { listed: 1 },
      expiresAt: new Date(Date.now() + 60_000),
    });
    const data = toApiTaskPublicData(task);
    expect(data.taskId).toBe(String(task._id));
    expect(data.result).toEqual({ listed: 1 });
    expect(data.message).toBe("Completed");
  });
});

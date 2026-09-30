import { describe, expect, it } from "vitest";
import { startApiTaskRuntime, stopApiTaskRuntime } from "../startApiTaskRuntime.js";

describe("startApiTaskRuntime", () => {
  it("starts and stops without throwing", async () => {
    await startApiTaskRuntime();
    stopApiTaskRuntime();
    expect(true).toBe(true);
  });
});

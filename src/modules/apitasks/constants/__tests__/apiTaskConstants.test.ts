import { describe, expect, it } from "vitest";
import {
  API_TASK_KIND_IDS,
  isApiTaskKind,
  isApiTaskStatus,
} from "../apiTaskConstants.js";

describe("apiTaskConstants", () => {
  it("recognizes kinds and statuses", () => {
    expect(isApiTaskKind("grabo-skus.sync")).toBe(true);
    expect(isApiTaskKind("nope")).toBe(false);
    expect(isApiTaskStatus("completed")).toBe(true);
    expect(isApiTaskStatus("ready")).toBe(false);
    expect(API_TASK_KIND_IDS.length).toBeGreaterThan(0);
  });
});

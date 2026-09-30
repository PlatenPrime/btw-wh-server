import { describe, expect, it } from "vitest";
import { buildApiTasksMigratedBody } from "../sendApiTasksMigrated.js";
import { API_TASKS_MIGRATED_CODE } from "../../constants/apiTaskConstants.js";

describe("sendApiTasksMigrated", () => {
  it("builds migrated payload", () => {
    const body = buildApiTasksMigratedBody("grabo-skus.sync");
    expect(body.code).toBe(API_TASKS_MIGRATED_CODE);
    expect(body.kind).toBe("grabo-skus.sync");
  });
});

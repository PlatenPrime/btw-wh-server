import { describe, expect, it } from "vitest";
import {
  API_TASK_KIND_DEFINITIONS,
  getApiTaskKindDefinition,
} from "../apiTaskKindDefinitions.js";
import { API_TASK_KIND_IDS } from "../../constants/apiTaskConstants.js";

describe("apiTaskKindDefinitions", () => {
  it("has definition for every kind", () => {
    for (const kind of API_TASK_KIND_IDS) {
      expect(getApiTaskKindDefinition(kind)?.kind).toBe(kind);
      expect(API_TASK_KIND_DEFINITIONS[kind].oldPath).toBeTruthy();
    }
  });

  it("returns undefined for unknown kind", () => {
    expect(getApiTaskKindDefinition("nope")).toBeUndefined();
  });
});

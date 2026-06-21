import { describe, expect, it } from "vitest";

import { REDACT_PATHS } from "../redact.js";

describe("REDACT_PATHS", () => {
  it("содержит authorization и password", () => {
    expect(REDACT_PATHS).toContain("req.headers.authorization");
    expect(REDACT_PATHS).toContain("password");
  });
});

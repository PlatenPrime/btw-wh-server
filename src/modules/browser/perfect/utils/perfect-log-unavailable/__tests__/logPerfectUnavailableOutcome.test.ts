import { describe, expect, it, vi } from "vitest";
import { logBrowserError } from "../../../../utils/browserRequest.js";
import { logPerfectUnavailableOutcome } from "../logPerfectUnavailableOutcome.js";

vi.mock("../../../../utils/browserRequest.js", () => ({
  logBrowserError: vi.fn(),
}));

describe("logPerfectUnavailableOutcome", () => {
  it("logs reason with url status and productPageHtml flag", () => {
    logPerfectUnavailableOutcome("https://x/p", "empty body", 200, false);
    expect(logBrowserError).toHaveBeenCalledWith(
      "Perfect stock unavailable (empty body)",
      expect.objectContaining({
        message: "url=https://x/p status=200 productPageHtml=false",
      })
    );
  });
});

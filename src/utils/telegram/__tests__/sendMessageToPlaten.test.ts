import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the sendMessageToTGUser function
vi.mock("../sendMessageToTGUser.js", () => ({
  sendMessageToTGUser: vi.fn(),
}));

// Mock constants
vi.mock("../../../constants/telegram", () => ({
  BTW_PLATEN_ID: "555196992",
}));

// Import function after mocking
import { sendMessageToPlaten } from "../sendMessageToPlaten.js";
import { sendMessageToTGUser } from "../sendMessageToTGUser.js";

const mockSendMessageToTGUser = vi.mocked(sendMessageToTGUser);

describe("sendMessageToPlaten", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call sendMessageToTGUser with correct parameters", async () => {
    mockSendMessageToTGUser.mockResolvedValueOnce();

    await sendMessageToPlaten("Test message");

    expect(mockSendMessageToTGUser).toHaveBeenCalledWith(
      "Test message",
      "555196992"
    );
  });

  it("should pass through errors from sendMessageToTGUser", async () => {
    const error = new Error("Test error");
    mockSendMessageToTGUser.mockRejectedValueOnce(error);

    await expect(sendMessageToPlaten("Test message")).rejects.toThrow(
      "Test error"
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the sendMessageToTGChat function
vi.mock("../sendMessageToTGChat.js", () => ({
  sendMessageToTGChat: vi.fn(),
}));

// Mock constants
vi.mock("../../../constants/telegram", () => ({
  BTW_CHAT_ID: "-1002121224059",
}));

// Import function after mocking
import { sendMessageToBTWChat } from "../sendMessageToBTWChat.js";
import { sendMessageToTGChat } from "../sendMessageToTGChat.js";

const mockSendMessageToTGChat = vi.mocked(sendMessageToTGChat);

describe("sendMessageToBTWChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call sendMessageToTGChat with correct parameters", async () => {
    mockSendMessageToTGChat.mockResolvedValueOnce();

    await sendMessageToBTWChat("Test message");

    expect(mockSendMessageToTGChat).toHaveBeenCalledWith({
      message: "Test message",
      chatId: "-1002121224059",
    });
  });

  it("should pass through errors from sendMessageToTGChat", async () => {
    const error = new Error("Test error");
    mockSendMessageToTGChat.mockRejectedValueOnce(error);

    await expect(sendMessageToBTWChat("Test message")).rejects.toThrow(
      "Test error"
    );
  });
});

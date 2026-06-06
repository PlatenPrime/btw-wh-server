import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../sendMessageToTGChat.js", () => ({
  sendMessageToTGChat: vi.fn(),
}));

vi.mock("../../../constants/telegram", () => ({
  getBtwAnalyticsChatId: () => "-100999888777",
}));

import { sendMessageToAnalyticsChat } from "../sendMessageToAnalyticsChat.js";
import { sendMessageToTGChat } from "../sendMessageToTGChat.js";

const mockSendMessageToTGChat = vi.mocked(sendMessageToTGChat);

describe("sendMessageToAnalyticsChat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call sendMessageToTGChat with analytics chat id", async () => {
    mockSendMessageToTGChat.mockResolvedValueOnce();

    await sendMessageToAnalyticsChat("Test message");

    expect(mockSendMessageToTGChat).toHaveBeenCalledWith({
      message: "Test message",
      chatId: "-100999888777",
    });
  });

  it("should pass through errors from sendMessageToTGChat", async () => {
    const error = new Error("Test error");
    mockSendMessageToTGChat.mockRejectedValueOnce(error);

    await expect(sendMessageToAnalyticsChat("Test message")).rejects.toThrow(
      "Test error"
    );
  });
});

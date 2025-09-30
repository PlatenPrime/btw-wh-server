import { beforeEach, describe, expect, it, vi } from "vitest";
// Mock the sendMessageToTGChat function
vi.mock("../sendMessageToTGChat.js", () => ({
    sendMessageToTGChat: vi.fn(),
}));
// Mock constants
vi.mock("../../../constants/telegram", () => ({
    BTW_DEFS_CHAT_ID: "-1003183753234",
}));
// Import function after mocking
import { sendMessageToDefsChat } from "../sendMessageToDefsChat.js";
import { sendMessageToTGChat } from "../sendMessageToTGChat.js";
const mockSendMessageToTGChat = vi.mocked(sendMessageToTGChat);
describe("sendMessageToDefsChat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("should call sendMessageToTGChat with correct parameters", async () => {
        mockSendMessageToTGChat.mockResolvedValueOnce();
        await sendMessageToDefsChat("Test message");
        expect(mockSendMessageToTGChat).toHaveBeenCalledWith({
            message: "Test message",
            chatId: "-1003183753234",
        });
    });
    it("should pass through errors from sendMessageToTGChat", async () => {
        const error = new Error("Test error");
        mockSendMessageToTGChat.mockRejectedValueOnce(error);
        await expect(sendMessageToDefsChat("Test message")).rejects.toThrow("Test error");
    });
});

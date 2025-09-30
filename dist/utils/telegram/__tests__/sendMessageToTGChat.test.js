import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);
// Mock console methods
const consoleSpy = {
    log: vi.spyOn(console, "log"),
    error: vi.spyOn(console, "error"),
};
// Mock constants
vi.mock("../../../constants/telegram", () => ({
    BTW_TOKEN: "mock-token",
}));
// Import function after mocking
import { sendMessageToTGChat } from "../sendMessageToTGChat.js";
describe("sendMessageToTGChat", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy.log.mockClear();
        consoleSpy.error.mockClear();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    const mockSuccessResponse = {
        ok: true,
        result: {
            message_id: 125,
            from: {
                id: 1,
                is_bot: true,
                first_name: "Test Bot",
                username: "testbot",
            },
            chat: {
                id: -1002121224059,
                title: "Test Chat",
                type: "group",
            },
            date: 1640995200,
            text: "Test message",
        },
    };
    it("should send message to chat successfully", async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: mockSuccessResponse,
        });
        await sendMessageToTGChat({
            message: "Test message",
            chatId: "-1002121224059",
        });
        expect(mockedAxios.post).toHaveBeenCalledWith("https://api.telegram.org/botmock-token/sendMessage", {
            chat_id: "-1002121224059",
            text: "Test message",
        });
        expect(consoleSpy.log).toHaveBeenCalledWith("Message sent to chat:", mockSuccessResponse);
    });
    it("should throw error for empty message", async () => {
        await expect(sendMessageToTGChat({ message: "", chatId: "-1002121224059" })).rejects.toThrow("Message cannot be empty");
        await expect(sendMessageToTGChat({ message: "   ", chatId: "-1002121224059" })).rejects.toThrow("Message cannot be empty");
    });
    it("should throw error for empty chatId", async () => {
        await expect(sendMessageToTGChat({ message: "Test message", chatId: "" })).rejects.toThrow("Chat ID cannot be empty");
        await expect(sendMessageToTGChat({ message: "Test message", chatId: "   " })).rejects.toThrow("Chat ID cannot be empty");
    });
    it("should throw error when Telegram API returns error", async () => {
        const errorResponse = {
            ok: false,
            error_code: 400,
            description: "Bad Request: chat not found",
        };
        mockedAxios.post.mockResolvedValueOnce({
            data: errorResponse,
        });
        await expect(sendMessageToTGChat({ message: "Test message", chatId: "-1002121224059" })).rejects.toThrow("Failed to send message to chat: Telegram API error: [object Object]");
    });
    it("should handle axios errors", async () => {
        const axiosError = new Error("Network error");
        mockedAxios.post.mockRejectedValueOnce(axiosError);
        await expect(sendMessageToTGChat({ message: "Test message", chatId: "-1002121224059" })).rejects.toThrow("Failed to send message to chat: Network error");
    });
});

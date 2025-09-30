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
import { sendMessageToTGUser } from "../sendMessageToTGUser.js";
describe("sendMessageToTGUser", () => {
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
            message_id: 123,
            from: {
                id: 1,
                is_bot: true,
                first_name: "Test Bot",
                username: "testbot",
            },
            chat: {
                id: 123456789,
                type: "private",
            },
            date: 1640995200,
            text: "Test message",
        },
    };
    it("should send message successfully", async () => {
        mockedAxios.post.mockResolvedValueOnce({
            data: mockSuccessResponse,
        });
        await sendMessageToTGUser("Test message", "123456789");
        expect(mockedAxios.post).toHaveBeenCalledWith("https://api.telegram.org/botmock-token/sendMessage", {
            chat_id: "123456789",
            text: "Test message",
            parse_mode: "HTML",
        });
        expect(consoleSpy.log).toHaveBeenCalledWith("Message sent to user:", mockSuccessResponse);
    });
    it("should throw error for empty message", async () => {
        await expect(sendMessageToTGUser("", "123456789")).rejects.toThrow("Message cannot be empty");
        await expect(sendMessageToTGUser("   ", "123456789")).rejects.toThrow("Message cannot be empty");
    });
    it("should throw error for empty userId", async () => {
        await expect(sendMessageToTGUser("Test message", "")).rejects.toThrow("User ID cannot be empty");
        await expect(sendMessageToTGUser("Test message", "   ")).rejects.toThrow("User ID cannot be empty");
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
        await expect(sendMessageToTGUser("Test message", "123456789")).rejects.toThrow("Failed to send message to user: Telegram API error: [object Object]");
    });
    it("should handle axios errors", async () => {
        const axiosError = new Error("Network error");
        mockedAxios.post.mockRejectedValueOnce(axiosError);
        await expect(sendMessageToTGUser("Test message", "123456789")).rejects.toThrow("Failed to send message to user: Network error");
    });
    it("should handle unknown errors", async () => {
        mockedAxios.post.mockRejectedValueOnce("Unknown error");
        await expect(sendMessageToTGUser("Test message", "123456789")).rejects.toThrow("Failed to send message to user: Unknown error occurred");
    });
});

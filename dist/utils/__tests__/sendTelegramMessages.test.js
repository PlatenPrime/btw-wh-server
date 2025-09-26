import axios from "axios";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BTW_CHAT_ID, BTW_PLATEN_ID, BTW_TOKEN, } from "../../constants/telegram.js";
import { sendFileToPlaten, sendFileToUser, sendMessageToBTWChat, sendMessageToChat, sendMessageToPlaten, sendMessageToUser, } from "../sendTelegramMessages.js";
// Mock axios
vi.mock("axios");
const mockedAxios = axios;
// Mock fs
vi.mock("fs");
const mockedFs = vi.mocked(fs);
// Use constants from telegram.ts
// Mock data
const mockTelegramResponse = {
    ok: true,
    result: {
        message_id: 123,
        from: {
            id: 123456789,
            is_bot: true,
            first_name: "Test Bot",
            username: "test_bot",
        },
        chat: {
            id: parseInt(BTW_CHAT_ID),
            title: "Test Chat",
            type: "supergroup",
        },
        date: 1640995200,
        text: "Test message",
    },
};
const mockDocumentResponse = {
    ok: true,
    result: {
        message_id: 124,
        from: {
            id: 123456789,
            is_bot: true,
            first_name: "Test Bot",
            username: "test_bot",
        },
        chat: {
            id: parseInt(BTW_PLATEN_ID),
            type: "private",
        },
        date: 1640995200,
        document: {
            file_name: "test.txt",
            mime_type: "text/plain",
            file_id: "BAADBAADrwADBREAAYag",
            file_unique_id: "AgADrwADBREAAYag",
            file_size: 1024,
        },
    },
};
describe("sendTelegramMessages", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedAxios.post.mockResolvedValue({ data: mockTelegramResponse });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe("sendMessageToBTWChat", () => {
        it("should send message successfully", async () => {
            const message = "Test message";
            await sendMessageToBTWChat(message);
            expect(mockedAxios.post).toHaveBeenCalledWith(`https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`, {
                chat_id: BTW_CHAT_ID,
                text: message,
            });
        });
        it("should throw error for empty message", async () => {
            await expect(sendMessageToBTWChat("")).rejects.toThrow("Message cannot be empty");
            await expect(sendMessageToBTWChat("   ")).rejects.toThrow("Message cannot be empty");
        });
        it("should throw error when API returns error", async () => {
            const errorResponse = {
                ok: false,
                error_code: 400,
                description: "Bad Request: chat not found",
            };
            mockedAxios.post.mockResolvedValue({ data: errorResponse });
            await expect(sendMessageToBTWChat("Test")).rejects.toThrow("Failed to send message");
        });
        it("should handle network errors", async () => {
            mockedAxios.post.mockRejectedValue(new Error("Network error"));
            await expect(sendMessageToBTWChat("Test")).rejects.toThrow("Failed to send message: Network error");
        });
    });
    describe("sendMessageToChat", () => {
        it("should send message to specific chat", async () => {
            const message = "Test message";
            const chatId = "-1001234567890";
            await sendMessageToChat(message, chatId);
            expect(mockedAxios.post).toHaveBeenCalledWith(`https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`, {
                chat_id: chatId,
                text: message,
            });
        });
        it("should throw error for empty message", async () => {
            await expect(sendMessageToChat("", "123")).rejects.toThrow("Message cannot be empty");
        });
        it("should throw error for empty chatId", async () => {
            await expect(sendMessageToChat("Test", "")).rejects.toThrow("Chat ID cannot be empty");
        });
        it("should handle API errors", async () => {
            mockedAxios.post.mockRejectedValue(new Error("API Error"));
            await expect(sendMessageToChat("Test", "123")).rejects.toThrow("Failed to send message to chat: API Error");
        });
    });
    describe("sendMessageToUser", () => {
        it("should send HTML message to user", async () => {
            const message = "<b>Bold text</b>";
            const userId = "123456789";
            await sendMessageToUser(message, userId);
            expect(mockedAxios.post).toHaveBeenCalledWith(`https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`, {
                chat_id: userId,
                text: message,
                parse_mode: "HTML",
            });
        });
        it("should throw error for empty message", async () => {
            await expect(sendMessageToUser("", "123")).rejects.toThrow("Message cannot be empty");
        });
        it("should throw error for empty userId", async () => {
            await expect(sendMessageToUser("Test", "")).rejects.toThrow("User ID cannot be empty");
        });
        it("should handle unknown errors", async () => {
            mockedAxios.post.mockRejectedValue("Unknown error");
            await expect(sendMessageToUser("Test", "123")).rejects.toThrow("Failed to send message to user: Unknown error occurred");
        });
    });
    describe("sendMessageToPlaten", () => {
        it("should send message to Platen user", async () => {
            const message = "Test message to Platen";
            await sendMessageToPlaten(message);
            expect(mockedAxios.post).toHaveBeenCalledWith(`https://api.telegram.org/bot${BTW_TOKEN}/sendMessage`, {
                chat_id: BTW_PLATEN_ID,
                text: message,
                parse_mode: "HTML",
            });
        });
        it("should propagate errors from sendMessageToUser", async () => {
            mockedAxios.post.mockRejectedValue(new Error("User not found"));
            await expect(sendMessageToPlaten("Test")).rejects.toThrow("Failed to send message to user: User not found");
        });
    });
    describe("sendFileToUser", () => {
        beforeEach(() => {
            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.createReadStream.mockReturnValue("mock-stream");
            mockedAxios.post.mockResolvedValue({ data: mockDocumentResponse });
        });
        it("should send file successfully", async () => {
            const filePath = "/path/to/file.txt";
            const userId = "123456789";
            await sendFileToUser(filePath, userId);
            expect(mockedFs.existsSync).toHaveBeenCalledWith(filePath);
            expect(mockedFs.createReadStream).toHaveBeenCalledWith(filePath);
            expect(mockedAxios.post).toHaveBeenCalledWith(`https://api.telegram.org/bot${BTW_TOKEN}/sendDocument`, expect.any(Object), // FormData object
            {
                headers: expect.any(Object),
            });
        });
        it("should throw error for empty file path", async () => {
            await expect(sendFileToUser("", "123")).rejects.toThrow("File path cannot be empty");
        });
        it("should throw error for empty userId", async () => {
            await expect(sendFileToUser("/path/file.txt", "")).rejects.toThrow("User ID cannot be empty");
        });
        it("should throw error if file does not exist", async () => {
            mockedFs.existsSync.mockReturnValue(false);
            await expect(sendFileToUser("/nonexistent/file.txt", "123")).rejects.toThrow("File does not exist: /nonexistent/file.txt");
        });
        it("should handle API errors", async () => {
            mockedAxios.post.mockRejectedValue(new Error("File too large"));
            await expect(sendFileToUser("/path/file.txt", "123")).rejects.toThrow("Failed to send file to user: File too large");
        });
        it("should handle API response errors", async () => {
            const errorResponse = {
                ok: false,
                error_code: 413,
                description: "Request Entity Too Large",
            };
            mockedAxios.post.mockResolvedValue({ data: errorResponse });
            await expect(sendFileToUser("/path/file.txt", "123")).rejects.toThrow("Failed to send file to user");
        });
    });
    describe("sendFileToPlaten", () => {
        beforeEach(() => {
            mockedFs.existsSync.mockReturnValue(true);
            mockedFs.createReadStream.mockReturnValue("mock-stream");
            mockedAxios.post.mockResolvedValue({ data: mockDocumentResponse });
        });
        it("should send file to Platen user", async () => {
            const filePath = "/path/to/file.txt";
            await sendFileToPlaten(filePath);
            expect(mockedFs.existsSync).toHaveBeenCalledWith(filePath);
            expect(mockedFs.createReadStream).toHaveBeenCalledWith(filePath);
            expect(mockedAxios.post).toHaveBeenCalledWith(`https://api.telegram.org/bot${BTW_TOKEN}/sendDocument`, expect.any(Object), // FormData object
            {
                headers: expect.any(Object),
            });
        });
        it("should propagate errors from sendFileToUser", async () => {
            mockedAxios.post.mockRejectedValue(new Error("Network timeout"));
            await expect(sendFileToPlaten("/path/file.txt")).rejects.toThrow("Failed to send file to user: Network timeout");
        });
    });
    describe("Integration tests", () => {
        it("should handle complex error scenarios", async () => {
            // Test with null/undefined values
            mockedAxios.post.mockRejectedValue(null);
            await expect(sendMessageToBTWChat("Test")).rejects.toThrow("Failed to send message: Unknown error occurred");
        });
        it("should validate all required parameters", async () => {
            const testCases = [
                {
                    fn: () => sendMessageToBTWChat(""),
                    expected: "Message cannot be empty",
                },
                {
                    fn: () => sendMessageToChat("", "123"),
                    expected: "Message cannot be empty",
                },
                {
                    fn: () => sendMessageToChat("Test", ""),
                    expected: "Chat ID cannot be empty",
                },
                {
                    fn: () => sendMessageToUser("", "123"),
                    expected: "Message cannot be empty",
                },
                {
                    fn: () => sendMessageToUser("Test", ""),
                    expected: "User ID cannot be empty",
                },
                {
                    fn: () => sendFileToUser("", "123"),
                    expected: "File path cannot be empty",
                },
                {
                    fn: () => sendFileToUser("Test", ""),
                    expected: "User ID cannot be empty",
                },
            ];
            for (const testCase of testCases) {
                await expect(testCase.fn()).rejects.toThrow(testCase.expected);
            }
        });
    });
    describe("Token security", () => {
        it("should use correct token format", async () => {
            await sendMessageToBTWChat("Test");
            expect(mockedAxios.post).toHaveBeenCalledWith(expect.stringContaining(`bot${BTW_TOKEN}`), expect.any(Object));
        });
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../../../../constants/roles.js";
const { logModuleError } = vi.hoisted(() => ({
    logModuleError: vi.fn(),
}));
vi.mock("../../../../../../utils/telegram/sendMessageToBTWChat.js", () => ({
    sendMessageToBTWChat: vi.fn(),
}));
vi.mock("../../../../../../logging/logModuleError.js", () => ({
    logModuleError,
}));
import { sendMessageToBTWChat } from "../../../../../../utils/telegram/sendMessageToBTWChat.js";
import { sendCreateAskMesUtil } from "../sendCreateAskMesUtil.js";
const mockSendMessageToBTWChat = vi.mocked(sendMessageToBTWChat);
describe("sendCreateAskMesUtil", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    beforeEach(() => {
        vi.clearAllMocks();
    });
    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("отправляет сообщение для USER", async () => {
        process.env.NODE_ENV = "development";
        mockSendMessageToBTWChat.mockResolvedValueOnce(undefined);
        const askerData = {
            _id: "user1",
            fullname: "Test User",
            role: RoleType.USER,
            telegram: "123456",
        };
        await sendCreateAskMesUtil({
            message: "Test message",
            askerData,
        });
        expect(mockSendMessageToBTWChat).toHaveBeenCalledWith("Test message");
    });
    it("не отправляет сообщение для ADMIN", async () => {
        process.env.NODE_ENV = "development";
        const askerData = {
            _id: "user1",
            fullname: "Test Admin",
            role: RoleType.ADMIN,
            telegram: "123456",
        };
        await sendCreateAskMesUtil({
            message: "Test message",
            askerData,
        });
        expect(mockSendMessageToBTWChat).not.toHaveBeenCalled();
    });
    it("не отправляет сообщение для PRIME", async () => {
        process.env.NODE_ENV = "development";
        const askerData = {
            _id: "user1",
            fullname: "Test Prime",
            role: RoleType.PRIME,
            telegram: "123456",
        };
        await sendCreateAskMesUtil({
            message: "Test message",
            askerData,
        });
        expect(mockSendMessageToBTWChat).not.toHaveBeenCalled();
    });
    it("не отправляет сообщение в тестовом окружении", async () => {
        process.env.NODE_ENV = "test";
        const askerData = {
            _id: "user1",
            fullname: "Test User",
            role: RoleType.USER,
            telegram: "123456",
        };
        await sendCreateAskMesUtil({
            message: "Test message",
            askerData,
        });
        expect(mockSendMessageToBTWChat).not.toHaveBeenCalled();
    });
    it("обрабатывает ошибки при отправке", async () => {
        process.env.NODE_ENV = "development";
        const error = new Error("Telegram API error");
        mockSendMessageToBTWChat.mockRejectedValueOnce(error);
        const askerData = {
            _id: "user1",
            fullname: "Test User",
            role: RoleType.USER,
            telegram: "123456",
        };
        await expect(sendCreateAskMesUtil({
            message: "Test message",
            askerData,
        })).resolves.not.toThrow();
        expect(logModuleError).toHaveBeenCalledWith("asks", error, "Failed to send Telegram notification:");
    });
    it("отправляет сообщение в production для USER", async () => {
        process.env.NODE_ENV = "production";
        mockSendMessageToBTWChat.mockResolvedValueOnce(undefined);
        const askerData = {
            _id: "user1",
            fullname: "Test User",
            role: RoleType.USER,
            telegram: "123456",
        };
        await sendCreateAskMesUtil({
            message: "Test message",
            askerData,
        });
        expect(mockSendMessageToBTWChat).toHaveBeenCalledWith("Test message");
    });
});

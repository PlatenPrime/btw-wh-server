import { beforeEach, describe, expect, it, vi } from "vitest";
// Mock sendMessageToTGUser
vi.mock("../../../../../../utils/telegram/sendMessageToTGUser.js", () => ({
    sendMessageToTGUser: vi.fn(),
}));
// Mock console.error
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
// Import after mocking
import { sendMessageToTGUser } from "../../../../../../utils/telegram/sendMessageToTGUser.js";
import { sendRejectAskMesUtil } from "../sendRejectAskMesUtil.js";
const mockSendMessageToTGUser = vi.mocked(sendMessageToTGUser);
describe("sendRejectAskMesUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("отправляет уведомление об отклонении заявки", async () => {
        mockSendMessageToTGUser.mockResolvedValueOnce(undefined);
        await sendRejectAskMesUtil({
            message: "Ваша заявка отклонена",
            telegramChatId: "123456789",
        });
        expect(mockSendMessageToTGUser).toHaveBeenCalledWith("Ваша заявка отклонена", "123456789");
    });
    it("обрабатывает ошибки при отправке", async () => {
        const error = new Error("Telegram API error");
        mockSendMessageToTGUser.mockRejectedValueOnce(error);
        // Не должно выбрасывать ошибку, только логировать
        await expect(sendRejectAskMesUtil({
            message: "Ваша заявка отклонена",
            telegramChatId: "123456789",
        })).resolves.not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to send Telegram notification:", error);
    });
    it("обрабатывает различные типы ошибок", async () => {
        const error = "String error";
        mockSendMessageToTGUser.mockRejectedValueOnce(error);
        await expect(sendRejectAskMesUtil({
            message: "Test message",
            telegramChatId: "123456789",
        })).resolves.not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to send Telegram notification:", error);
    });
    it("отправляет сообщение с корректным форматом", async () => {
        mockSendMessageToTGUser.mockResolvedValueOnce(undefined);
        const message = "Заявка #123 отклонена. Причина: недостаточно товара на складе.";
        const telegramChatId = "987654321";
        await sendRejectAskMesUtil({
            message,
            telegramChatId,
        });
        expect(mockSendMessageToTGUser).toHaveBeenCalledWith(message, telegramChatId);
    });
});

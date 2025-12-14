import { beforeEach, describe, expect, it, vi } from "vitest";
// Mock sendMessageToTGUser
vi.mock("../../../../../../utils/telegram/sendMessageToTGUser.js", () => ({
    sendMessageToTGUser: vi.fn(),
}));
// Mock console.error
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });
// Import after mocking
import { sendMessageToTGUser } from "../../../../../../utils/telegram/sendMessageToTGUser.js";
import { sendCompleteAskMesUtil } from "../sendCompleteAskMesUtil.js";
const mockSendMessageToTGUser = vi.mocked(sendMessageToTGUser);
describe("sendCompleteAskMesUtil", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it("отправляет уведомление о завершении заявки", async () => {
        mockSendMessageToTGUser.mockResolvedValueOnce(undefined);
        await sendCompleteAskMesUtil({
            message: "Ваша заявка завершена",
            telegramChatId: "123456789",
        });
        expect(mockSendMessageToTGUser).toHaveBeenCalledWith("Ваша заявка завершена", "123456789");
    });
    it("обрабатывает ошибки при отправке", async () => {
        const error = new Error("Telegram API error");
        mockSendMessageToTGUser.mockRejectedValueOnce(error);
        // Не должно выбрасывать ошибку, только логировать
        await expect(sendCompleteAskMesUtil({
            message: "Ваша заявка завершена",
            telegramChatId: "123456789",
        })).resolves.not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to send Telegram notification:", error);
    });
    it("обрабатывает различные типы ошибок", async () => {
        const error = "String error";
        mockSendMessageToTGUser.mockRejectedValueOnce(error);
        await expect(sendCompleteAskMesUtil({
            message: "Test message",
            telegramChatId: "123456789",
        })).resolves.not.toThrow();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to send Telegram notification:", error);
    });
    it("отправляет сообщение с корректным форматом", async () => {
        mockSendMessageToTGUser.mockResolvedValueOnce(undefined);
        const message = "Заявка #123 завершена. Товар готов к выдаче.";
        const telegramChatId = "987654321";
        await sendCompleteAskMesUtil({
            message,
            telegramChatId,
        });
        expect(mockSendMessageToTGUser).toHaveBeenCalledWith(message, telegramChatId);
    });
});

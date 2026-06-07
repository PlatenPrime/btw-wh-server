import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../../../../constants/roles.js";
vi.mock("../../../../../../utils/telegram/sendMessageToKasaChat.js", () => ({
    sendMessageToKasaChat: vi.fn(),
}));
import { sendMessageToKasaChat } from "../../../../../../utils/telegram/sendMessageToKasaChat.js";
import { sendCreateKaskMesUtil } from "../sendCreateKaskMesUtil.js";
describe("sendCreateKaskMesUtil", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    beforeEach(() => {
        vi.mocked(sendMessageToKasaChat).mockReset();
    });
    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
    });
    it("не отправляет сообщение для роли PRIME", async () => {
        process.env.NODE_ENV = "development";
        await sendCreateKaskMesUtil({
            message: "test",
            role: RoleType.PRIME,
        });
        expect(sendMessageToKasaChat).not.toHaveBeenCalled();
    });
    it("не отправляет сообщение в test окружении", async () => {
        process.env.NODE_ENV = "test";
        await sendCreateKaskMesUtil({
            message: "test",
            role: RoleType.USER,
        });
        expect(sendMessageToKasaChat).not.toHaveBeenCalled();
    });
    it("отправляет сообщение для USER вне test окружения", async () => {
        process.env.NODE_ENV = "development";
        await sendCreateKaskMesUtil({
            message: "Новий запит",
            role: RoleType.USER,
        });
        expect(sendMessageToKasaChat).toHaveBeenCalledOnce();
        expect(sendMessageToKasaChat).toHaveBeenCalledWith("Новий запит");
    });
    it("не пробрасывает ошибку Telegram наружу", async () => {
        process.env.NODE_ENV = "development";
        vi.mocked(sendMessageToKasaChat).mockRejectedValueOnce(new Error("Telegram error"));
        await expect(sendCreateKaskMesUtil({
            message: "test",
            role: RoleType.USER,
        })).resolves.toBeUndefined();
    });
});

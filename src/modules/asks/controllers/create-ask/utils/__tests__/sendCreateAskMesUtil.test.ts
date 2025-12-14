import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../../../../constants/roles.js";

// Mock sendMessageToBTWChat
vi.mock("../../../../../../utils/telegram/sendMessageToBTWChat.js", () => ({
  sendMessageToBTWChat: vi.fn(),
}));

// Mock console.error
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

// Import after mocking
import { sendMessageToBTWChat } from "../../../../../../utils/telegram/sendMessageToBTWChat.js";
import { sendCreateAskMesUtil } from "../sendCreateAskMesUtil.js";

const mockSendMessageToBTWChat = vi.mocked(sendMessageToBTWChat);

describe("sendCreateAskMesUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Сохраняем оригинальное значение NODE_ENV
    process.env.NODE_ENV = process.env.NODE_ENV || "test";
  });

  it("отправляет сообщение для не-PRIME пользователей", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    mockSendMessageToBTWChat.mockResolvedValueOnce(undefined);

    const askerData = {
      _id: "user1" as any,
      fullname: "Test User",
      role: RoleType.USER,
      telegram: "123456",
    } as any;

    await sendCreateAskMesUtil({
      message: "Test message",
      askerData,
    });

    expect(mockSendMessageToBTWChat).toHaveBeenCalledWith("Test message");
    process.env.NODE_ENV = originalEnv;
  });

  it("отправляет сообщение для ADMIN пользователей", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    mockSendMessageToBTWChat.mockResolvedValueOnce(undefined);

    const askerData = {
      _id: "user1" as any,
      fullname: "Test Admin",
      role: RoleType.ADMIN,
      telegram: "123456",
    } as any;

    await sendCreateAskMesUtil({
      message: "Test message",
      askerData,
    });

    expect(mockSendMessageToBTWChat).toHaveBeenCalledWith("Test message");
    process.env.NODE_ENV = originalEnv;
  });

  it("пропускает отправку для PRIME пользователей", async () => {
    const askerData = {
      _id: "user1" as any,
      fullname: "Test Prime",
      role: RoleType.PRIME,
      telegram: "123456",
    } as any;

    await sendCreateAskMesUtil({
      message: "Test message",
      askerData,
    });

    expect(mockSendMessageToBTWChat).not.toHaveBeenCalled();
  });

  it("не отправляет сообщение в тестовом окружении", async () => {
    process.env.NODE_ENV = "test";

    const askerData = {
      _id: "user1" as any,
      fullname: "Test User",
      role: RoleType.USER,
      telegram: "123456",
    } as any;

    await sendCreateAskMesUtil({
      message: "Test message",
      askerData,
    });

    // В тестовом окружении не должно быть вызова
    expect(mockSendMessageToBTWChat).not.toHaveBeenCalled();
  });

  it("обрабатывает ошибки при отправке", async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    const error = new Error("Telegram API error");
    mockSendMessageToBTWChat.mockRejectedValueOnce(error);

    const askerData = {
      _id: "user1" as any,
      fullname: "Test User",
      role: RoleType.USER,
      telegram: "123456",
    } as any;

    // Не должно выбрасывать ошибку, только логировать
    await expect(
      sendCreateAskMesUtil({
        message: "Test message",
        askerData,
      })
    ).resolves.not.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to send Telegram notification:",
      error
    );
    process.env.NODE_ENV = originalEnv;
  });

  it("отправляет сообщение в production окружении для не-PRIME", async () => {
    process.env.NODE_ENV = "production";
    mockSendMessageToBTWChat.mockResolvedValueOnce(undefined);

    const askerData = {
      _id: "user1" as any,
      fullname: "Test User",
      role: RoleType.USER,
      telegram: "123456",
    } as any;

    await sendCreateAskMesUtil({
      message: "Test message",
      askerData,
    });

    expect(mockSendMessageToBTWChat).toHaveBeenCalledWith("Test message");
  });
});

import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

// Mock fs
vi.mock("fs");
const mockedFs = vi.mocked(fs, true);

// Mock FormData
vi.mock("form-data", () => {
  const MockFormData = vi.fn();
  return { default: MockFormData };
});

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
import { sendFileToTGUser } from "../sendFileToTGUser.js";
import { TelegramDocumentResponse } from "../types.js";

describe("sendFileToTGUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockSuccessResponse: TelegramDocumentResponse = {
    ok: true,
    result: {
      message_id: 124,
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
      document: {
        file_name: "test.txt",
        mime_type: "text/plain",
        file_id: "BAADBAADrwADBREAAYag",
        file_unique_id: "AgADrwADBREAAYag",
        file_size: 1024,
      },
    },
  };

  const mockFormData = {
    append: vi.fn(),
    getHeaders: vi
      .fn()
      .mockReturnValue({ "content-type": "multipart/form-data" }),
  };

  beforeEach(() => {
    const MockFormData = vi.fn(() => mockFormData);
    (FormData as any).mockImplementation(MockFormData);
    mockedFs.existsSync.mockReturnValue(true);
    mockedFs.createReadStream.mockReturnValue("mock-stream" as any);
  });

  it("should send file successfully", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: mockSuccessResponse,
    });

    await sendFileToTGUser("/path/to/file.txt", "123456789");

    expect(mockedFs.existsSync).toHaveBeenCalledWith("/path/to/file.txt");
    expect(mockFormData.append).toHaveBeenCalledWith("chat_id", "123456789");
    expect(mockFormData.append).toHaveBeenCalledWith("document", "mock-stream");
    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://api.telegram.org/botmock-token/sendDocument",
      mockFormData,
      {
        headers: {
          "content-type": "multipart/form-data",
        },
      }
    );
    expect(consoleSpy.log).toHaveBeenCalledWith(
      "Файл успішно відправлено користувачу:",
      mockSuccessResponse
    );
  });

  it("should throw error for empty filePath", async () => {
    await expect(sendFileToTGUser("", "123456789")).rejects.toThrow(
      "File path cannot be empty"
    );
    await expect(sendFileToTGUser("   ", "123456789")).rejects.toThrow(
      "File path cannot be empty"
    );
  });

  it("should throw error for empty userId", async () => {
    await expect(sendFileToTGUser("/path/to/file.txt", "")).rejects.toThrow(
      "User ID cannot be empty"
    );
    await expect(sendFileToTGUser("/path/to/file.txt", "   ")).rejects.toThrow(
      "User ID cannot be empty"
    );
  });

  it("should throw error when file does not exist", async () => {
    mockedFs.existsSync.mockReturnValue(false);

    await expect(
      sendFileToTGUser("/path/to/nonexistent.txt", "123456789")
    ).rejects.toThrow("File does not exist: /path/to/nonexistent.txt");
  });

  it("should throw error when Telegram API returns error", async () => {
    const errorResponse = {
      ok: false,
      error_code: 400,
      description: "Bad Request: file too large",
    };
    mockedAxios.post.mockResolvedValueOnce({
      data: errorResponse,
    });

    await expect(
      sendFileToTGUser("/path/to/file.txt", "123456789")
    ).rejects.toThrow(
      "Не вдалося відправити файл користувачу: Telegram API error: [object Object]"
    );
  });

  it("should handle axios errors", async () => {
    const axiosError = new Error("Network error");
    mockedAxios.post.mockRejectedValueOnce(axiosError);

    await expect(
      sendFileToTGUser("/path/to/file.txt", "123456789")
    ).rejects.toThrow("Не вдалося відправити файл користувачу: Network error");
  });
});

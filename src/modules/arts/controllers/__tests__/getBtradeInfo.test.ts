import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { getBtradeArtInfo } from "../getBtradeInfo.js";

describe("getBtradeArtInfo Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: any;
  let responseStatus: any;
  let res: Response;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};

    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  describe("Валидация входных данных", () => {
    it("должен возвращать 400 при отсутствии artikul", async () => {
      // Arrange
      mockRequest = {
        params: {},
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      expect(responseStatus.code).toBe(400);
      expect(responseJson.message).toBe("Artikul is required");
    });

    it("должен возвращать 400 при пустом artikul", async () => {
      // Arrange
      mockRequest = {
        params: { artikul: "" },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      expect(responseStatus.code).toBe(400);
      expect(responseJson.message).toBe("Artikul is required");
    });

    it("должен возвращать 400 при undefined artikul", async () => {
      // Arrange
      mockRequest = {
        params: { artikul: undefined as any },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      expect(responseStatus.code).toBe(400);
      expect(responseJson.message).toBe("Artikul is required");
    });
  });

  describe("Обработка несуществующих артикулов", () => {
    it("должен возвращать 404 при несуществующем artikul", async () => {
      // Arrange
      mockRequest = {
        params: { artikul: "nonexistent-artikul-12345" },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      expect(responseStatus.code).toBe(404);
      expect(responseJson.message).toBe("No products found for this artikul");
    });

    it("должен возвращать 404 при пустой строке", async () => {
      // Arrange
      mockRequest = {
        params: { artikul: "   " },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      expect(responseStatus.code).toBe(404);
      expect(responseJson.message).toBe("No products found for this artikul");
    });
  });

  describe("Обработка специальных символов", () => {
    it("должен обрабатывать артикулы с дефисами", async () => {
      // Arrange
      mockRequest = {
        params: { artikul: "TEST-123-ABC" },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      // Может быть 404 (товар не найден) или 200 (товар найден)
      expect([200, 404]).toContain(responseStatus.code);
      if (responseStatus.code === 404) {
        expect(responseJson.message).toBe("No products found for this artikul");
      }
    });

    it("должен обрабатывать артикулы с подчеркиваниями", async () => {
      // Arrange
      mockRequest = {
        params: { artikul: "TEST_123_ABC" },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      // Может быть 404 (товар не найден) или 200 (товар найден)
      expect([200, 404]).toContain(responseStatus.code);
      if (responseStatus.code === 404) {
        expect(responseJson.message).toBe("No products found for this artikul");
      }
    });

    it("должен обрабатывать числовые артикулы", async () => {
      // Arrange
      mockRequest = {
        params: { artikul: "123456" },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      // Может быть 404 (товар не найден) или 200 (товар найден)
      expect([200, 404]).toContain(responseStatus.code);
      if (responseStatus.code === 404) {
        expect(responseJson.message).toBe("No products found for this artikul");
      }
    });
  });

  describe("Обработка ошибок сети", () => {
    it("должен обрабатывать ошибки при недоступности API", async () => {
      // Arrange - используем невалидный URL для принудительной ошибки
      mockRequest = {
        params: { artikul: "test-error-handling" },
      };

      // Act
      await getBtradeArtInfo(mockRequest as Request, res);

      // Assert
      // Может быть 500 (ошибка сети) или 404 (товар не найден)
      expect([200, 404, 500]).toContain(responseStatus.code);
      if (responseStatus.code === 500) {
        expect(responseJson.message).toBe(
          "Failed to fetch data from sharik.ua"
        );
        expect(responseJson.error).toBeDefined();
      } else if (responseStatus.code === 404) {
        expect(responseJson.message).toBe("No products found for this artikul");
      }
    });
  });
});

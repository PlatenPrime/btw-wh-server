import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock axios before importing the module
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

import axios from "axios";
import { Request, Response } from "express";
import { getBtradeArtInfo } from "../getBtradeInfo.js";

const mockedAxios = vi.mocked(axios);

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
    vi.clearAllMocks();
  });

  it("should return product info for valid artikul", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product Name</div>
              <div class="one-item-price">1,250.50 грн</div>
              <div class="one-item-quantity">В наявності: 15 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "TEST123" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.nameukr).toBe("Test Product Name");
    expect(responseJson.price).toBe(1250.5);
    expect(responseJson.quantity).toBe(15);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://sharik.ua/ua/search/?q=TEST123"
    );
  });

  it("should return 400 when artikul is missing", async () => {
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

  it("should return 400 when artikul is empty", async () => {
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

  it("should return 404 when no products found", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <!-- No products -->
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "NONEXISTENT" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("No products found for this artikul");
  });

  it("should return 404 when product data is incomplete", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <!-- Missing price and quantity -->
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "INCOMPLETE" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Product data not found or incomplete");
  });

  it("should handle price with different formats", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <div class="one-item-price">2,500 грн</div>
              <div class="one-item-quantity">В наявності: 10 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "PRICE_TEST" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.price).toBe(2500);
  });

  it("should handle quantity with different formats", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <div class="one-item-price">100 грн</div>
              <div class="one-item-quantity">Кількість: 25 pieces</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "QUANTITY_TEST" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.quantity).toBe(25);
  });

  it("should handle zero quantity", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <div class="one-item-price">50 грн</div>
              <div class="one-item-quantity">В наявності: 0 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "ZERO_QUANTITY" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.quantity).toBe(0);
  });

  it("should handle invalid price format", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <div class="one-item-price">Invalid Price</div>
              <div class="one-item-quantity">В наявності: 5 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "INVALID_PRICE" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Product data not found or incomplete");
  });

  it("should handle invalid quantity format", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Test Product</div>
              <div class="one-item-price">100 грн</div>
              <div class="one-item-quantity">В наявності: Invalid</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "INVALID_QUANTITY" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Product data not found or incomplete");
  });

  it("should handle axios error", async () => {
    // Arrange
    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error")
    );

    mockRequest = {
      params: { artikul: "ERROR_TEST" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Parsing Btrade artikul failed");
    expect(responseJson.error).toBeDefined();
  });

  it("should handle special characters in artikul", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Special Product</div>
              <div class="one-item-price">100 грн</div>
              <div class="one-item-quantity">В наявності: 5 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "SPECIAL-123_ABC" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://sharik.ua/ua/search/?q=SPECIAL-123_ABC"
    );
  });

  it("should handle Ukrainian characters in product name", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">Українська назва з їїї</div>
              <div class="one-item-price">200 грн</div>
              <div class="one-item-quantity">В наявності: 10 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "UKRAINIAN" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.nameukr).toBe("Українська назва з їїї");
  });

  it("should handle multiple products and return first one", async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="car-col">
            <div class="one-item">
              <div class="one-item-tit">First Product</div>
              <div class="one-item-price">100 грн</div>
              <div class="one-item-quantity">В наявності: 5 шт</div>
            </div>
            <div class="one-item">
              <div class="one-item-tit">Second Product</div>
              <div class="one-item-price">200 грн</div>
              <div class="one-item-quantity">В наявності: 10 шт</div>
            </div>
          </div>
        </body>
      </html>
    `;

    (vi.mocked(axios).get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: mockHtml,
    });

    mockRequest = {
      params: { artikul: "MULTIPLE" },
    };

    // Act
    await getBtradeArtInfo(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseJson.nameukr).toBe("First Product");
    expect(responseJson.price).toBe(100);
    expect(responseJson.quantity).toBe(5);
  });
});

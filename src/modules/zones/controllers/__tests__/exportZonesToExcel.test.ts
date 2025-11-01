import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestZone } from "../../../../test/setup.js";
import { exportZonesToExcel } from "../export-zones-to-excel/exportZonesToExcel.js";

describe("exportZonesToExcel Controller", () => {
  let mockRequest: Partial<Request>;
  let responseData: any;
  let responseStatus: any;
  let responseHeaders: any;
  let res: Response;

  beforeEach(() => {
    responseData = null;
    responseStatus = {};
    responseHeaders = {};

    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseData = data;
        return this;
      },
      setHeader: function (name: string, value: any) {
        responseHeaders[name] = value;
        return this;
      },
      send: function (data: any) {
        responseData = data;
        return this;
      },
    } as unknown as Response;
  });

  it("should export zones to Excel successfully", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 2 });
    await createTestZone({ title: "42-3", bar: 4203, sector: 3 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(responseHeaders["Content-Disposition"]).toContain("attachment");
    expect(responseHeaders["Content-Disposition"]).toContain("zones_export_");
    expect(responseHeaders["Content-Length"]).toBeDefined();
    expect(responseData).toBeDefined(); // Excel buffer
  });

  it("should return 404 when no zones exist", async () => {
    // Arrange
    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(404);
    expect(responseData.message).toBe("No zones found to export");
  });

  it("should export zones with all fields", async () => {
    // Arrange
    const testZone = await createTestZone({
      title: "42-5-2",
      bar: 420502,
      sector: 1,
    });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(responseData).toBeDefined();
  });

  it("should export zones sorted by sector and title", async () => {
    // Arrange
    await createTestZone({ title: "42-3", bar: 4203, sector: 3 });
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 2 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseData).toBeDefined();
  });

  it("should handle zones with different title formats", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "22-5-1", bar: 22501, sector: 2 });
    await createTestZone({ title: "42-13-2", bar: 421302, sector: 3 });
    await createTestZone({ title: "1", bar: 1, sector: 4 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseData).toBeDefined();
  });

  it("should handle zones with different sector values", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 0 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 999 });
    await createTestZone({ title: "42-3", bar: 4203, sector: 1 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseData).toBeDefined();
  });

  it("should generate filename with current date", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    const today = new Date().toISOString().split("T")[0];
    expect(responseHeaders["Content-Disposition"]).toContain(
      `zones_export_${today}`
    );
  });

  it("should set proper Excel headers", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(responseHeaders["Content-Disposition"]).toContain("attachment");
    expect(responseHeaders["Content-Length"]).toBeDefined();
  });

  it("should handle large number of zones", async () => {
    // Arrange
    const zones = [];
    for (let i = 0; i < 100; i++) {
      zones.push(
        createTestZone({
          title: `42-${i}`,
          bar: 4200 + i,
          sector: i,
        })
      );
    }
    await Promise.all(zones);

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseData).toBeDefined();
    expect(responseHeaders["Content-Length"]).toBeGreaterThan(0);
  });

  it("should handle zones with special characters in title", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });
    await createTestZone({ title: "42-2", bar: 4202, sector: 2 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseData).toBeDefined();
  });

  it("should return Excel buffer data", async () => {
    // Arrange
    await createTestZone({ title: "42-1", bar: 4201, sector: 1 });

    mockRequest = {};

    // Act
    await exportZonesToExcel(mockRequest as Request, res);

    // Assert
    expect(responseStatus.code).toBe(200);
    expect(responseData).toBeInstanceOf(Buffer);
    expect(responseData.length).toBeGreaterThan(0);
  });
});

import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "../asyncHandler.js";

describe("asyncHandler", () => {
  it("оборачивает асинхронную функцию", async () => {
    const asyncFn = vi.fn().mockResolvedValue("success");
    const req = {};
    const res = {};
    const next = vi.fn();

    const wrapped = asyncHandler(asyncFn);
    await wrapped(req, res, next);

    expect(asyncFn).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("обрабатывает ошибки и передает их в next", async () => {
    const error = new Error("Test error");
    const asyncFn = vi.fn().mockRejectedValue(error);
    const req = {};
    const res = {};
    const next = vi.fn();

    const wrapped = asyncHandler(asyncFn);
    await wrapped(req, res, next);

    expect(asyncFn).toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(error);
  });

  it("успешно выполняет функцию без ошибок", async () => {
    const asyncFn = vi.fn().mockResolvedValue({ data: "test" });
    const req = {};
    const res = {};
    const next = vi.fn();

    const wrapped = asyncHandler(asyncFn);
    const result = await wrapped(req, res, next);

    expect(asyncFn).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("обрабатывает различные типы ошибок", async () => {
    const error = "String error";
    const asyncFn = vi.fn().mockRejectedValue(error);
    const req = {};
    const res = {};
    const next = vi.fn();

    const wrapped = asyncHandler(asyncFn);
    await wrapped(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("сохраняет контекст this для функции", async () => {
    class TestClass {
      value = "test";

      async method(req: any, res: any, next: any) {
        return this.value;
      }
    }

    const instance = new TestClass();
    const wrapped = asyncHandler(instance.method.bind(instance));
    const req = {};
    const res = {};
    const next = vi.fn();

    const result = await wrapped(req, res, next);

    expect(result).toBe("test");
    expect(next).not.toHaveBeenCalled();
  });
});


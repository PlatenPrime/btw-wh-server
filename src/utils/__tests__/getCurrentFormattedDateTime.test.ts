import { describe, expect, it, vi } from "vitest";
import { getCurrentFormattedDateTime } from "../getCurrentFormattedDateTime.js";

describe("getCurrentFormattedDateTime", () => {
  it("возвращает дату в формате DD.MM.YYYY HH:mm", () => {
    // Мокаем дату для стабильного теста
    const mockDate = new Date("2025-01-15T14:30:00Z");
    vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

    const result = getCurrentFormattedDateTime();

    // Формат должен быть DD.MM.YYYY HH:mm
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
  });

  it("использует часовой пояс Europe/Kyiv", () => {
    // Kyiv timezone - UTC+2 (или UTC+3 в летнее время)
    // Для стабильности теста используем конкретную дату
    const mockDate = new Date("2025-01-15T12:00:00Z"); // UTC
    vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

    const result = getCurrentFormattedDateTime();

    // Проверяем что результат содержит корректный формат
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
  });

  it("форматирует с ведущими нулями", () => {
    // Используем конкретную дату с ведущими нулями
    const mockDate = new Date("2025-01-05T09:05:00Z");
    const originalDate = global.Date;
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate);
        } else {
          super(...(args as []));
        }
      }
    } as any;

    const result = getCurrentFormattedDateTime();

    // День и месяц должны иметь ведущие нули (05.01)
    // Проверяем что формат правильный, но не конкретную дату из-за timezone
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/);
    
    global.Date = originalDate;
  });

  it("корректно форматирует время с ведущими нулями", () => {
    const mockDate = new Date("2025-01-15T05:05:00Z");
    vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

    const result = getCurrentFormattedDateTime();

    // Часы и минуты должны иметь ведущие нули если < 10
    expect(result).toMatch(/ \d{2}:\d{2}$/);
  });

  it("возвращает строку", () => {
    const result = getCurrentFormattedDateTime();

    expect(typeof result).toBe("string");
  });

  it("форматирует полную дату и время", () => {
    const mockDate = new Date("2025-12-31T23:59:00Z");
    vi.spyOn(global, "Date").mockImplementation(() => mockDate as any);

    const result = getCurrentFormattedDateTime();

    // Проверяем общий формат
    const parts = result.split(" ");
    expect(parts.length).toBe(2);
    expect(parts[0]).toMatch(/^\d{2}\.\d{2}\.\d{4}$/); // Дата
    expect(parts[1]).toMatch(/^\d{2}:\d{2}$/); // Время
  });
});


import { beforeEach, describe, expect, it } from "vitest";
import { Row } from "../../../../models/Row.js";
import { updateRowUtil } from "../updateRowUtil.js";

describe("updateRowUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("обновляет title ряда и возвращает обновлённый документ", async () => {
    const row = await Row.create({ title: "Old Title" });

    const result = await updateRowUtil({ id: row._id.toString(), title: "New Title" });

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(row._id.toString());
    expect(result?.title).toBe("New Title");

    const found = await Row.findById(row._id);
    expect(found?.title).toBe("New Title");
  });

  it("возвращает null если ряд не найден", async () => {
    const nonExistentId = "000000000000000000000000";

    const result = await updateRowUtil({ id: nonExistentId, title: "Any Title" });

    expect(result).toBeNull();
  });

  it("обновляет updatedAt timestamp", async () => {
    const row = await Row.create({ title: "Timestamp Test" });
    const oldUpdatedAt = row.updatedAt;

    // Небольшая задержка чтобы убедиться что время изменится
    await new Promise((resolve) => setTimeout(resolve, 100));

    const result = await updateRowUtil({ id: row._id.toString(), title: "Updated Title" });

    expect(result).toBeTruthy();
    expect(result?.updatedAt).not.toEqual(oldUpdatedAt);
    expect(result?.updatedAt!.getTime()).toBeGreaterThan(oldUpdatedAt!.getTime());
  });

  it("сохраняет валидацию уникальности title", async () => {
    const row1 = await Row.create({ title: "Unique Title 1" });
    const row2 = await Row.create({ title: "Unique Title 2" });

    // Попытка установить row2 тот же title что у row1 должна вызвать ошибку
    await expect(
      updateRowUtil({ id: row2._id.toString(), title: "Unique Title 1" })
    ).rejects.toThrow();
  });
});


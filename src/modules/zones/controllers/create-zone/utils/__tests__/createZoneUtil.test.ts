import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { createZoneUtil } from "../createZoneUtil.js";

describe("createZoneUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("создаёт Zone и возвращает сохранённый документ", async () => {
    const result = await createZoneUtil({
      title: "42-5",
      bar: 4250,
      sector: 0,
    });

    expect(result).toBeTruthy();
    expect(result._id).toBeDefined();
    expect(result.title).toBe("42-5");
    expect(result.bar).toBe(4250);
    expect(result.sector).toBe(0);

    const found = await Zone.findById(result._id);
    expect(found).not.toBeNull();
  });

  it("добавляет timestamps автоматически", async () => {
    const result = await createZoneUtil({
      title: "43-6",
      bar: 4360,
      sector: 0,
    });

    expect(result.createdAt).toBeDefined();
    expect(result.updatedAt).toBeDefined();
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it("создаёт зону с указанным sector", async () => {
    const result = await createZoneUtil({
      title: "44-7",
      bar: 4470,
      sector: 5,
    });

    expect(result.sector).toBe(5);
  });
});


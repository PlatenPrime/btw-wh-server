import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { getZoneByTitleUtil } from "../getZoneByTitleUtil.js";

describe("getZoneByTitleUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает null если зона не найдена", async () => {
    const result = await getZoneByTitleUtil("NonExistent Zone");

    expect(result).toBeNull();
  });

  it("возвращает зону по title", async () => {
    await Zone.create({ title: "80-1", bar: 8010, sector: 0 });

    const result = await getZoneByTitleUtil("80-1");

    expect(result).toBeTruthy();
    expect(result?.title).toBe("80-1");
  });

  it("trim whitespace в title", async () => {
    await Zone.create({ title: "81-2", bar: 8120, sector: 0 });

    const result = await getZoneByTitleUtil(" 81-2 ");

    expect(result).toBeTruthy();
    expect(result?.title).toBe("81-2");
  });
});









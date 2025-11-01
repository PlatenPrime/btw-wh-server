import { beforeEach, describe, expect, it } from "vitest";
import { Zone } from "../../../../models/Zone.js";
import { checkZoneDuplicatesUpdateUtil } from "../checkZoneDuplicatesUpdateUtil.js";

describe("checkZoneDuplicatesUpdateUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("возвращает null если дубликатов нет", async () => {
    const zone1 = await Zone.create({ title: "110-1", bar: 11010, sector: 0 });
    const zone2 = await Zone.create({ title: "110-2", bar: 11020, sector: 0 });

    const result = await checkZoneDuplicatesUpdateUtil({
      id: zone1._id.toString(),
      updateData: { title: "110-3" },
    });

    expect(result).toBeNull();
  });

  it("возвращает дубликат по title", async () => {
    const zone1 = await Zone.create({ title: "111-1", bar: 11110, sector: 0 });
    const zone2 = await Zone.create({ title: "111-2", bar: 11120, sector: 0 });

    const result = await checkZoneDuplicatesUpdateUtil({
      id: zone1._id.toString(),
      updateData: { title: "111-2" },
    });

    expect(result).toBeTruthy();
    expect(result?._id.toString()).toBe(zone2._id.toString());
  });

  it("не возвращает саму обновляемую зону", async () => {
    const zone = await Zone.create({ title: "112-1", bar: 11210, sector: 0 });

    const result = await checkZoneDuplicatesUpdateUtil({
      id: zone._id.toString(),
      updateData: { title: "112-1" },
    });

    expect(result).toBeNull();
  });

  it("возвращает дубликат по bar", async () => {
    const zone1 = await Zone.create({ title: "113-1", bar: 11310, sector: 0 });
    const zone2 = await Zone.create({ title: "113-2", bar: 11320, sector: 0 });

    const result = await checkZoneDuplicatesUpdateUtil({
      id: zone1._id.toString(),
      updateData: { bar: 11320 },
    });

    expect(result).toBeTruthy();
    expect(result?.bar).toBe(11320);
  });
});



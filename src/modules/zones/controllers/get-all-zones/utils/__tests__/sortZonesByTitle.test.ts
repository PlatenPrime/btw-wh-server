import { describe, expect, it } from "vitest";
import type { IZone } from "../../../../models/Zone.js";
import { sortZonesByTitle } from "../sortZonesByTitle.js";

const zone = (title: string): IZone => ({ title }) as IZone;

describe("sortZonesByTitle", () => {
  it("sorts zones numerically by title segments ascending", () => {
    const zones = [zone("42-11-2"), zone("42-8-1"), zone("42-2-10")];

    const sorted = sortZonesByTitle(zones, "asc");

    expect(sorted.map((z) => z.title)).toEqual(["42-2-10", "42-8-1", "42-11-2"]);
  });

  it("sorts zones numerically by title segments descending", () => {
    const zones = [zone("42-2-10"), zone("42-11-2"), zone("42-8-1")];

    const sorted = sortZonesByTitle(zones, "desc");

    expect(sorted.map((z) => z.title)).toEqual(["42-11-2", "42-8-1", "42-2-10"]);
  });

  it("handles zones with different segment counts", () => {
    const zones = [zone("42-10"), zone("42-2-1"), zone("42-2")];

    const sorted = sortZonesByTitle(zones, "asc");

    expect(sorted.map((z) => z.title)).toEqual(["42-2", "42-2-1", "42-10"]);
  });
});

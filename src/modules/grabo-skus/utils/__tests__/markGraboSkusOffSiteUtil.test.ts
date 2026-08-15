import { beforeEach, describe, expect, it } from "vitest";
import { GraboSku } from "../../models/GraboSku.js";
import { markGraboSkusOffSiteUtil } from "../markGraboSkusOffSiteUtil.js";

const NOW = new Date("2026-08-15T00:00:00.000Z");
const ON_SITE_URL = "https://www.grabo-balloons.com/en/g1-balloon-a";
const GONE_URL = "https://www.grabo-balloons.com/en/g2-balloon-b";

async function seed(productId: string, url: string, isOnSite: boolean) {
  await GraboSku.create({
    title: productId,
    productId,
    url,
    isOnSite,
    lastSeenAt: NOW,
  });
}

describe("markGraboSkusOffSiteUtil", () => {
  beforeEach(async () => {
    await GraboSku.deleteMany({});
  });

  it("returns 0 and does not write when listedUrls is empty", async () => {
    await seed("G1", ON_SITE_URL, true);
    expect(await markGraboSkusOffSiteUtil([])).toBe(0);
    const doc = await GraboSku.findOne({ productId: "G1" }).lean();
    expect(doc?.isOnSite).toBe(true);
  });

  it("sets isOnSite false only for urls not in listed set", async () => {
    await seed("G1", ON_SITE_URL, true);
    await seed("G2", GONE_URL, true);

    const modified = await markGraboSkusOffSiteUtil([ON_SITE_URL]);
    expect(modified).toBe(1);

    expect((await GraboSku.findOne({ productId: "G1" }).lean())?.isOnSite).toBe(
      true
    );
    expect((await GraboSku.findOne({ productId: "G2" }).lean())?.isOnSite).toBe(
      false
    );
  });
});

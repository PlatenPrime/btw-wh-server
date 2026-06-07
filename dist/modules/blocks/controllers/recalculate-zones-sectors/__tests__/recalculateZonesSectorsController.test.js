import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { recalculateZonesSectors } from "../recalculateZonesSectors.js";
describe("recalculateZonesSectorsController", () => {
    let res;
    let responseJson;
    let responseStatus;
    beforeEach(() => {
        responseJson = {};
        responseStatus = {};
        res = {
            status: function (code) {
                responseStatus.code = code;
                return this;
            },
            json: function (data) {
                responseJson = data;
                return this;
            },
        };
    });
    it("200: recalculates zones sectors successfully", async () => {
        const block = await Block.create({ title: "Block 1", order: 1, segs: [] });
        const zone = await Zone.create({ title: "42-1-1", bar: 420101, sector: 0 });
        await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 0,
            zones: [{ _id: zone._id, title: zone.title }],
        });
        const req = {};
        await recalculateZonesSectors(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.message).toBe("Zones sectors recalculated successfully");
        expect(responseJson.data.blocksProcessed).toBe(1);
        expect(responseJson.data.updatedZones).toBeGreaterThan(0);
        const updatedZone = await Zone.findById(zone._id).lean().exec();
        expect(updatedZone?.sector).toBe(1001);
    });
    it("200: handles empty database", async () => {
        const req = {};
        await recalculateZonesSectors(req, res);
        expect(responseStatus.code).toBe(200);
        expect(responseJson.data.blocksProcessed).toBe(0);
        expect(responseJson.data.updatedZones).toBe(0);
    });
});

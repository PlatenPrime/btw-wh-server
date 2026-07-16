import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { Event } from "../../../../models/Event.js";
import { createEventUtil } from "../../../../utils/createEventUtil.js";
import { getEventByIdUtil } from "../getEventByIdUtil.js";
describe("getEventByIdUtil", () => {
    beforeEach(async () => {
        await Event.deleteMany({});
    });
    it("returns event by id", async () => {
        const user = await createTestUser({ username: `byid-${Date.now()}` });
        const created = await createEventUtil({
            userId: user._id.toString(),
            department: "constants",
            description: "Find me",
        });
        const found = await getEventByIdUtil(created._id.toString());
        expect(found).not.toBeNull();
        expect(found._id.toString()).toBe(created._id.toString());
        expect(found.description).toBe("Find me");
    });
    it("returns null when event not found", async () => {
        const found = await getEventByIdUtil(new Types.ObjectId().toString());
        expect(found).toBeNull();
    });
});

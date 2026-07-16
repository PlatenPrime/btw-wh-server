import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { mapUserToEventUserData } from "../mapUserToEventUserData.js";
describe("mapUserToEventUserData", () => {
    it("maps user document fields to EventUserData", async () => {
        const user = await createTestUser({
            fullname: "Mapper User",
            telegram: "999",
            photo: "p.png",
        });
        const result = mapUserToEventUserData(user);
        expect(result._id.equals(user._id)).toBe(true);
        expect(result.fullname).toBe("Mapper User");
        expect(result.telegram).toBe("999");
        expect(result.photo).toBe("p.png");
    });
    it("normalizes string _id to ObjectId", () => {
        const id = new Types.ObjectId();
        const result = mapUserToEventUserData({
            _id: id.toString(),
            fullname: "String Id",
        });
        expect(result._id).toBeInstanceOf(Types.ObjectId);
        expect(result._id.toString()).toBe(id.toString());
        expect(result.fullname).toBe("String Id");
    });
});

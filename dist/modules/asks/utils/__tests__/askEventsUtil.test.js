import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { buildAskEvent, mapUserToAskUserData } from "../askEventsUtil.js";
const createTestUser = () => ({
    _id: new Types.ObjectId(),
    fullname: "Test User",
    telegram: "@test_user",
    photo: "photo-url",
});
describe("mapUserToAskUserData", () => {
    it("возвращает AskUserData из IUser", () => {
        const user = createTestUser();
        const result = mapUserToAskUserData(user);
        expect(result).toEqual({
            _id: user._id,
            fullname: "Test User",
            telegram: "@test_user",
            photo: "photo-url",
        });
    });
});
describe("buildAskEvent", () => {
    it("создаёт событие create с текущей датой", () => {
        const user = createTestUser();
        const event = buildAskEvent({
            eventName: "create",
            user,
        });
        expect(event.eventName).toBe("create");
        expect(event.userData.fullname).toBe("Test User");
        expect(event.pullDetails).toBeUndefined();
        expect(event.date).toBeInstanceOf(Date);
    });
    it("создаёт событие pull с деталями", () => {
        const user = createTestUser();
        const pullDetails = {
            palletData: {
                _id: new Types.ObjectId(),
                title: "Pallet-1",
            },
            quant: 5,
            boxes: 2,
        };
        const event = buildAskEvent({
            eventName: "pull",
            user,
            pullDetails,
        });
        expect(event.eventName).toBe("pull");
        expect(event.pullDetails).toEqual(pullDetails);
    });
    it("бросает исключение если в pull нет pullDetails", () => {
        const user = createTestUser();
        expect(() => buildAskEvent({
            eventName: "pull",
            user,
        })).toThrow("Pull events require pullDetails payload");
    });
    it("бросает исключение если pullDetails переданы для события отличного от pull", () => {
        const user = createTestUser();
        expect(() => buildAskEvent({
            eventName: "create",
            user,
            pullDetails: {
                palletData: {
                    _id: new Types.ObjectId(),
                    title: "Pallet-1",
                },
                quant: 1,
                boxes: 1,
            },
        })).toThrow("Only pull events may contain pullDetails payload");
    });
});

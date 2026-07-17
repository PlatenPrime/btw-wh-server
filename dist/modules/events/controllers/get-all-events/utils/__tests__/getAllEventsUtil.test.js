import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../../test/setup.js";
import { Event } from "../../../../models/Event.js";
import { createEventUtil } from "../../../../utils/createEventUtil.js";
import { getAllEventsUtil } from "../getAllEventsUtil.js";
describe("getAllEventsUtil", () => {
    beforeEach(async () => {
        await Event.deleteMany({});
    });
    it("returns empty list when no events", async () => {
        const result = await getAllEventsUtil({ page: 1, limit: 20 });
        expect(result.events).toEqual([]);
        expect(result.pagination).toEqual({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
        });
    });
    it("returns events sorted by createdAt desc", async () => {
        const user = await createTestUser({ username: `list-${Date.now()}` });
        const first = await createEventUtil({
            userId: user._id.toString(),
            department: "constants",
            type: "create",
            description: "First",
        });
        const second = await createEventUtil({
            userId: user._id.toString(),
            department: "poses",
            type: "edit",
            description: "Second",
        });
        const result = await getAllEventsUtil({ page: 1, limit: 20 });
        expect(result.events).toHaveLength(2);
        expect(result.events[0]._id.toString()).toBe(second._id.toString());
        expect(result.events[1]._id.toString()).toBe(first._id.toString());
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.totalPages).toBe(1);
    });
    it("filters by department", async () => {
        const user = await createTestUser({ username: `dept-${Date.now()}` });
        await createEventUtil({
            userId: user._id.toString(),
            department: "constants",
            type: "create",
            description: "A",
        });
        await createEventUtil({
            userId: user._id.toString(),
            department: "poses",
            type: "edit",
            description: "B",
        });
        const result = await getAllEventsUtil({
            page: 1,
            limit: 20,
            department: "poses",
        });
        expect(result.events).toHaveLength(1);
        expect(result.events[0].department).toBe("poses");
    });
    it("filters by type", async () => {
        const user = await createTestUser({ username: `type-${Date.now()}` });
        await createEventUtil({
            userId: user._id.toString(),
            department: "constants",
            type: "create",
            description: "A",
        });
        await createEventUtil({
            userId: user._id.toString(),
            department: "constants",
            type: "edit",
            description: "B",
        });
        const result = await getAllEventsUtil({
            page: 1,
            limit: 20,
            type: "edit",
        });
        expect(result.events).toHaveLength(1);
        expect(result.events[0].type).toBe("edit");
    });
    it("filters by userId", async () => {
        const userA = await createTestUser({ username: `ua-${Date.now()}` });
        const userB = await createTestUser({ username: `ub-${Date.now()}` });
        await createEventUtil({
            userId: userA._id.toString(),
            department: "constants",
            type: "create",
            description: "A",
        });
        await createEventUtil({
            userId: userB._id.toString(),
            department: "constants",
            type: "create",
            description: "B",
        });
        const result = await getAllEventsUtil({
            page: 1,
            limit: 20,
            userId: userA._id.toString(),
        });
        expect(result.events).toHaveLength(1);
        expect(result.events[0].userId.toString()).toBe(userA._id.toString());
    });
    it("filters by date range", async () => {
        const user = await createTestUser({ username: `date-${Date.now()}` });
        const event = await createEventUtil({
            userId: user._id.toString(),
            department: "constants",
            type: "create",
            description: "In range",
        });
        const from = new Date(event.createdAt.getTime() - 1000).toISOString();
        const to = new Date(event.createdAt.getTime() + 1000).toISOString();
        const inRange = await getAllEventsUtil({
            page: 1,
            limit: 20,
            from,
            to,
        });
        expect(inRange.events).toHaveLength(1);
        const outOfRange = await getAllEventsUtil({
            page: 1,
            limit: 20,
            from: new Date(event.createdAt.getTime() + 5000).toISOString(),
        });
        expect(outOfRange.events).toHaveLength(0);
    });
    it("paginates results", async () => {
        const user = await createTestUser({ username: `page-${Date.now()}` });
        for (let i = 0; i < 3; i++) {
            await createEventUtil({
                userId: user._id.toString(),
                department: "constants",
                type: "create",
                description: `Event ${i}`,
            });
        }
        const page1 = await getAllEventsUtil({ page: 1, limit: 2 });
        expect(page1.events).toHaveLength(2);
        expect(page1.pagination.total).toBe(3);
        expect(page1.pagination.totalPages).toBe(2);
        const page2 = await getAllEventsUtil({ page: 2, limit: 2 });
        expect(page2.events).toHaveLength(1);
    });
});

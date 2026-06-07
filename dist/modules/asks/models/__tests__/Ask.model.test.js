import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Ask } from "../Ask.js";
describe("Ask Model", () => {
    beforeEach(async () => {
        await Ask.deleteMany({});
    });
    describe("Schema Validation", () => {
        it("should fail without required artikul field", async () => {
            const user = await createTestUser({ username: `u-${Date.now()}` });
            const ask = new Ask({
                asker: user._id,
                askerData: {
                    _id: user._id,
                    fullname: user.fullname,
                },
            });
            await expect(ask.save()).rejects.toThrow();
        });
        it("should fail without required askerData", async () => {
            const user = await createTestUser({ username: `u2-${Date.now()}` });
            const ask = new Ask({
                artikul: "ART-001",
                asker: user._id,
            });
            await expect(ask.save()).rejects.toThrow();
        });
        it("should save with required fields and defaults", async () => {
            const user = await createTestUser({ username: `u3-${Date.now()}` });
            const saved = await Ask.create({
                artikul: "ART-REQ",
                asker: user._id,
                askerData: {
                    _id: user._id,
                    fullname: user.fullname,
                },
            });
            expect(saved.artikul).toBe("ART-REQ");
            expect(saved.status).toBe("new");
            expect(saved.sklad).toBe("pogrebi");
            expect(saved.pullQuant).toBe(0);
            expect(saved.pullBox).toBe(0);
            expect(saved.actions).toEqual([]);
            expect(saved.events).toEqual([]);
            expect(saved.createdAt).toBeInstanceOf(Date);
        });
        it("should accept valid status values", async () => {
            const user = await createTestUser({ username: `u4-${Date.now()}` });
            for (const status of ["new", "processing", "completed", "rejected"]) {
                const saved = await Ask.create({
                    artikul: `ART-${status}`,
                    status,
                    asker: user._id,
                    askerData: {
                        _id: user._id,
                        fullname: user.fullname,
                    },
                });
                expect(saved.status).toBe(status);
            }
        });
        it("should reject invalid status", async () => {
            const user = await createTestUser({ username: `u5-${Date.now()}` });
            const ask = new Ask({
                artikul: "ART-BAD",
                status: "invalid",
                asker: user._id,
                askerData: {
                    _id: user._id,
                    fullname: user.fullname,
                },
            });
            await expect(ask.save()).rejects.toThrow();
        });
    });
    describe("Ask events validation", () => {
        it("allows pull event without pullDetails on save (schema validator is advisory)", async () => {
            const user = await createTestUser({ username: `u6-${Date.now()}` });
            const saved = await Ask.create({
                artikul: "ART-PULL-NO-DETAILS",
                asker: user._id,
                askerData: {
                    _id: user._id,
                    fullname: user.fullname,
                },
                events: [
                    {
                        eventName: "pull",
                        userData: {
                            _id: user._id,
                            fullname: user.fullname,
                        },
                        date: new Date(),
                    },
                ],
            });
            expect(saved.events[0].eventName).toBe("pull");
            expect(saved.events[0].pullDetails).toBeUndefined();
        });
        it("saves pull event with pullDetails", async () => {
            const user = await createTestUser({ username: `u7-${Date.now()}` });
            const palletId = new mongoose.Types.ObjectId();
            const saved = await Ask.create({
                artikul: "ART-PULL-OK",
                asker: user._id,
                askerData: {
                    _id: user._id,
                    fullname: user.fullname,
                },
                events: [
                    {
                        eventName: "pull",
                        userData: {
                            _id: user._id,
                            fullname: user.fullname,
                        },
                        date: new Date(),
                        pullDetails: {
                            palletData: { _id: palletId, title: "P-1" },
                            quant: 5,
                            boxes: 1,
                        },
                    },
                ],
            });
            expect(saved.events).toHaveLength(1);
            expect(saved.events[0].eventName).toBe("pull");
            expect(saved.events[0].pullDetails?.quant).toBe(5);
        });
        it("rejects pullDetails for non-pull events", async () => {
            const user = await createTestUser({ username: `u8-${Date.now()}` });
            const ask = new Ask({
                artikul: "ART-CREATE",
                asker: user._id,
                askerData: {
                    _id: user._id,
                    fullname: user.fullname,
                },
                events: [
                    {
                        eventName: "create",
                        userData: {
                            _id: user._id,
                            fullname: user.fullname,
                        },
                        date: new Date(),
                        pullDetails: {
                            palletData: {
                                _id: new mongoose.Types.ObjectId(),
                                title: "P-1",
                            },
                            quant: 1,
                            boxes: 1,
                        },
                    },
                ],
            });
            await expect(ask.save()).rejects.toThrow();
        });
    });
});

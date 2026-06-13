import mongoose from "mongoose";
import { afterEach, describe, expect, it, vi } from "vitest";
import { connectTestMongo } from "../connectTestMongo.js";
import { testMongoGlobalState } from "../testMongoState.js";
describe("connectTestMongo", () => {
    afterEach(() => {
        testMongoGlobalState.mongoConnectPromise = undefined;
        testMongoGlobalState.mongoMemoryReplSet = undefined;
        vi.restoreAllMocks();
    });
    it("reuses in-flight connect promise for concurrent callers", async () => {
        const connectSpy = vi.spyOn(mongoose, "connect").mockResolvedValue(mongoose);
        Object.defineProperty(mongoose.connection, "readyState", {
            configurable: true,
            get: () => 0,
        });
        testMongoGlobalState.mongoMemoryReplSet = {
            getUri: () => "mongodb://127.0.0.1:27017/test",
            stop: vi.fn(),
        };
        const first = connectTestMongo();
        const second = connectTestMongo();
        expect(first).toBe(second);
        await first;
        expect(connectSpy).toHaveBeenCalledTimes(1);
    });
});

import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { sortPosesByPalletTitle } from "../sortPosesByPalletTitle.js";
describe("sortPosesByPalletTitle", () => {
    it("should sort poses by palletData.title numerically", () => {
        const poses = [
            {
                palletData: {
                    _id: new Types.ObjectId(),
                    title: "A-10-1",
                    isDef: false,
                },
            },
            {
                palletData: { _id: new Types.ObjectId(), title: "A-2-1", isDef: false },
            },
            {
                palletData: {
                    _id: new Types.ObjectId(),
                    title: "A-1-10",
                    isDef: false,
                },
            },
            {
                palletData: { _id: new Types.ObjectId(), title: "A-1-2", isDef: false },
            },
            {
                palletData: { _id: new Types.ObjectId(), title: "A-1-1", isDef: false },
            },
        ];
        const sorted = sortPosesByPalletTitle(poses);
        expect(sorted).toEqual([
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-1-1",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-1-2",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-1-10",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-2-1",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-10-1",
                    isDef: false,
                },
            },
        ]);
    });
    it("should handle single part titles", () => {
        const poses = [
            { palletData: { _id: new Types.ObjectId(), title: "10", isDef: false } },
            { palletData: { _id: new Types.ObjectId(), title: "2", isDef: false } },
            { palletData: { _id: new Types.ObjectId(), title: "1", isDef: false } },
        ];
        const sorted = sortPosesByPalletTitle(poses);
        expect(sorted).toEqual([
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "1",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "2",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "10",
                    isDef: false,
                },
            },
        ]);
    });
    it("should handle empty array", () => {
        const poses = [];
        const sorted = sortPosesByPalletTitle(poses);
        expect(sorted).toEqual([]);
    });
    it("should handle identical titles", () => {
        const poses = [
            {
                palletData: { _id: new Types.ObjectId(), title: "A-1-1", isDef: false },
            },
            {
                palletData: { _id: new Types.ObjectId(), title: "A-1-1", isDef: false },
            },
            {
                palletData: { _id: new Types.ObjectId(), title: "A-1-1", isDef: false },
            },
        ];
        const sorted = sortPosesByPalletTitle(poses);
        expect(sorted).toEqual([
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-1-1",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-1-1",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-1-1",
                    isDef: false,
                },
            },
        ]);
    });
    it("should handle mixed numeric and non-numeric parts", () => {
        const poses = [
            {
                palletData: {
                    _id: new Types.ObjectId(),
                    title: "A-10-B",
                    isDef: false,
                },
            },
            {
                palletData: { _id: new Types.ObjectId(), title: "A-2-B", isDef: false },
            },
            {
                palletData: { _id: new Types.ObjectId(), title: "A-1-B", isDef: false },
            },
        ];
        const sorted = sortPosesByPalletTitle(poses);
        expect(sorted).toEqual([
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-1-B",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-2-B",
                    isDef: false,
                },
            },
            {
                palletData: {
                    _id: expect.any(Types.ObjectId),
                    title: "A-10-B",
                    isDef: false,
                },
            },
        ]);
    });
});

import jwt from "jsonwebtoken";
import mongoose from "mongoose";
/**
 * Create a test JWT token for authenticated requests
 */
export const createTestToken = (userId, role = "user") => {
    const secret = process.env.JWT_SECRET || "test-secret";
    return jwt.sign({ userId, role }, secret, { expiresIn: "1h" });
};
/**
 * Create test request headers with authentication
 */
export const createAuthHeaders = (token) => ({
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
});
/**
 * Create test request headers without authentication
 */
export const createHeaders = () => ({
    "Content-Type": "application/json",
});
/**
 * Generate random test data
 */
export const generateTestData = {
    email: () => `test-${Date.now()}@example.com`,
    title: () => `Test Title ${Date.now()}`,
    description: () => `Test Description ${Date.now()}`,
    password: () => "TestPassword123!",
    firstName: () => `Test${Date.now()}`,
    lastName: () => `User${Date.now()}`,
};
/**
 * Mock Express request object
 */
export const createMockRequest = (data = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    ...data,
});
/**
 * Mock Express response object
 */
export const createMockResponse = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    res.send = (data) => {
        res.body = data;
        return res;
    };
    return res;
};
/**
 * Wait for a specified amount of time (useful for async operations)
 */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/**
 * Clean up test data
 */
export const cleanupTestData = async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
};
/**
 * Create a test Row
 */
export const createTestRow = async (rowData = {}) => {
    const Row = mongoose.model("Row");
    return await Row.create({
        title: rowData.title || `Test Row ${Date.now()}`,
        pallets: rowData.pallets || [],
        ...rowData,
    });
};
/**
 * Create a test Pallet
 */
export const createTestPallet = async (palletData = {}) => {
    const Pallet = mongoose.model("Pallet");
    return await Pallet.create({
        title: palletData.title || `Test Pallet ${Date.now()}`,
        row: palletData.row?._id ||
            (palletData.row && palletData.row._id) ||
            new mongoose.Types.ObjectId(),
        rowData: palletData.rowData ||
            palletData.row || {
            _id: new mongoose.Types.ObjectId(),
            title: "Test Row",
        },
        poses: palletData.poses || [],
        sector: palletData.sector,
        ...palletData,
    });
};
/**
 * Create a test Pos
 */
export const createTestPos = async (posData = {}) => {
    const Pos = mongoose.model("Pos");
    const pallet = posData.pallet || {
        _id: new mongoose.Types.ObjectId(),
        title: "Test Pallet",
    };
    const row = posData.row || {
        _id: new mongoose.Types.ObjectId(),
        title: "Test Row",
    };
    return await Pos.create({
        pallet: pallet._id,
        row: row._id,
        palletData: posData.palletData || pallet,
        rowData: posData.rowData || row,
        palletTitle: posData.palletTitle || pallet.title,
        rowTitle: posData.rowTitle || row.title,
        artikul: posData.artikul || `ART-${Date.now()}`,
        nameukr: posData.nameukr || "",
        quant: posData.quant || 10,
        boxes: posData.boxes || 1,
        date: posData.date,
        sklad: posData.sklad,
        comment: posData.comment || "",
        ...posData,
    });
};

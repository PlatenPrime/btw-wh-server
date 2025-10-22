import dotenv from "dotenv";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
// Import models to register schemas
import "../modules/arts/models/Art.js";
import "../modules/asks/models/Ask.js";
import "../modules/auth/models/User.js";
import "../modules/pallets/models/Pallet.js";
import "../modules/poses/models/Pos.js";
import "../modules/rows/models/Row.js";
import "../modules/zones/models/Zone.js";
// Load environment variables
dotenv.config({ path: ".env.test" });
let mongoServer;
beforeAll(async () => {
    try {
        // Start MongoDB Memory Server as a replica set for transactions
        mongoServer = await MongoMemoryReplSet.create({
            replSet: { count: 1 },
        });
        const mongoUri = mongoServer.getUri();
        // Connect to the in-memory replica set
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB Memory Server (replica set) for tests");
    }
    catch (error) {
        console.error("Failed to start MongoDB Memory Server (replica set):", error);
        throw error;
    }
}, 30000);
afterAll(async () => {
    try {
        await mongoose.connection.close();
        await mongoServer.stop();
        console.log("Disconnected from MongoDB Memory Server (replica set)");
    }
    catch (error) {
        console.error("Error closing MongoDB Memory Server (replica set):", error);
    }
});
beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
    }
});
afterEach(async () => {
    // Clean up after each test if needed
});
// Global test utilities
export const createTestUser = async (userData = {}) => {
    const User = mongoose.model("User");
    return await User.create({
        username: "testuser",
        fullname: "Test User",
        password: "password123",
        role: "user",
        ...userData,
    });
};
export const createTestArt = async (artData = {}) => {
    const Art = mongoose.model("Art");
    return await Art.create({
        artikul: "5555-5555",
        nameukr: "Test Art",
        namerus: "Тест Арт",
        zone: "A1",
        limit: 100,
        ...artData,
    });
};
export const createTestAsk = async (askData = {}) => {
    const Ask = mongoose.model("Ask");
    const User = mongoose.model("User");
    // Create a test user if not provided
    let asker = askData.asker;
    if (!asker) {
        asker = await User.create({
            username: `testuser-${Date.now()}`,
            fullname: "Test User",
            password: "password123",
            role: "user",
        });
    }
    return await Ask.create({
        artikul: `ART-${Date.now()}`,
        nameukr: "Test Ask",
        quant: 10,
        com: "Test comment",
        asker: asker._id,
        askerData: {
            _id: asker._id,
            fullname: asker.fullname,
            telegram: asker.telegram,
            photo: asker.photo,
        },
        solver: asker._id, // Same user for simplicity in tests
        status: "new",
        actions: [],
        ...askData,
    });
};
export const createTestZone = async (zoneData = {}) => {
    const Zone = mongoose.model("Zone");
    return await Zone.create({
        title: `42-5-${Date.now() % 100}`,
        bar: Date.now() % 1000000,
        sector: Math.floor(Math.random() * 1000000), // Генерируем уникальный sector
        ...zoneData,
    });
};

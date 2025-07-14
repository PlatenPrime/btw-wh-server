import dotenv from "dotenv";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";

// Import models to register schemas
import "../modules/arts/models/Art.js";
import "../modules/auth/models/User.js";

// Load environment variables
dotenv.config({ path: ".env.test" });

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB Memory Server for tests");
  } catch (error) {
    console.error("Failed to start MongoDB Memory Server:", error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  try {
    await mongoose.connection.close();
    await mongoServer.stop();
    console.log("Disconnected from MongoDB Memory Server");
  } catch (error) {
    console.error("Error closing MongoDB Memory Server:", error);
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
export const createTestUser = async (userData: any = {}) => {
  const User = mongoose.model("User");
  return await User.create({
    username: "testuser",
    fullname: "Test User",
    password: "password123",
    role: "user",
    ...userData,
  });
};

export const createTestArt = async (artData: any = {}) => {
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

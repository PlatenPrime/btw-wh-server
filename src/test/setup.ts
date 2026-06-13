import "./setup-env.js";

import mongoose from "mongoose";
import { afterEach, beforeAll, beforeEach } from "vitest";
import { connectTestMongo } from "./connectTestMongo.js";

const MONGO_HOOK_TIMEOUT_MS = 120_000;

beforeAll(async () => {
  await connectTestMongo();
  await import("./registerModels.js");
}, MONGO_HOOK_TIMEOUT_MS);

beforeEach(async () => {
  await connectTestMongo();

  if (mongoose.connection.readyState === 0) {
    return;
  }

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
    abc: "ABC",
    ...artData,
  });
};

export const createTestAsk = async (askData: any = {}) => {
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
    pullQuant: 0,
    pullBox: 0,
    ...askData,
  });
};

export const createTestPos = async (posData: any = {}) => {
  const Pos = mongoose.model("Pos");
  const Pallet = mongoose.model("Pallet");
  const Row = mongoose.model("Row");

  // Create test pallet and row if not provided
  let pallet = posData.pallet;
  let row = posData.row;

  if (!row) {
    row = await Row.create({
      title: `Test Row ${Date.now()}`,
    });
  }

  if (!pallet) {
    pallet = await Pallet.create({
      title: `Test Pallet ${Date.now()}`,
      sector: 1,
      isDef: false,
      poses: [],
      row: row._id,
      rowData: {
        _id: row._id,
        title: row.title,
      },
    });
  }

  return await Pos.create({
    artikul: `ART-${Date.now()}`,
    nameukr: "Test Position",
    quant: 10,
    boxes: 1,
    pallet: pallet._id,
    row: row._id,
    palletTitle: pallet.title,
    rowTitle: row.title,
    palletData: {
      _id: pallet._id,
      title: pallet.title,
      sector: pallet.sector,
      isDef: pallet.isDef,
    },
    rowData: {
      _id: row._id,
      title: row.title,
    },
    limit: 0,
    comment: "",
    ...posData,
  });
};

export const createTestZone = async (zoneData: any = {}) => {
  const Zone = mongoose.model("Zone");
  return await Zone.create({
    title: `42-5-${Date.now() % 100}`,
    bar: Date.now() % 1000000,
    sector: Math.floor(Math.random() * 1000000), // Генерируем уникальный sector
    ...zoneData,
  });
};

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

/**
 * Create a test JWT token for authenticated requests
 */
export const createTestToken = (userId: string, role: string = "user") => {
  const secret = process.env.JWT_SECRET || "test-secret";
  return jwt.sign({ userId, role }, secret, { expiresIn: "1h" });
};

/**
 * Create test request headers with authentication
 */
export const createAuthHeaders = (token: string) => ({
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
export const createMockRequest = (data: any = {}) => ({
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
  const res: any = {};
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  res.send = (data: any) => {
    res.body = data;
    return res;
  };
  return res;
};

/**
 * Wait for a specified amount of time (useful for async operations)
 */
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

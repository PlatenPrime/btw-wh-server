import { beforeEach, describe, expect, it } from "vitest";
import User from "../User.js";

describe("User Model", () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required username", async () => {
      const user = new User({
        fullname: "Test User",
        password: "password123",
      });

      await expect(user.save()).rejects.toThrow();
    });

    it("should fail without required fullname", async () => {
      const user = new User({
        username: `user-${Date.now()}`,
        password: "password123",
      });

      await expect(user.save()).rejects.toThrow();
    });

    it("should fail without required password", async () => {
      const user = new User({
        username: `user-${Date.now()}`,
        fullname: "Test User",
      });

      await expect(user.save()).rejects.toThrow();
    });

    it("should enforce unique username", async () => {
      const username = `unique-${Date.now()}`;
      await User.create({
        username,
        fullname: "First",
        password: "password123",
      });

      await expect(
        User.create({
          username,
          fullname: "Second",
          password: "password456",
        })
      ).rejects.toThrow();
    });

    it("should save with required fields", async () => {
      const saved = await User.create({
        username: `saved-${Date.now()}`,
        fullname: "Saved User",
        password: "password123",
        role: "USER",
        telegram: "@test",
        photo: "photo.png",
      });

      expect(saved.username).toContain("saved-");
      expect(saved.fullname).toBe("Saved User");
      expect(saved.role).toBe("USER");
      expect(saved.telegram).toBe("@test");
      expect(saved.photo).toBe("photo.png");
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });
  });
});

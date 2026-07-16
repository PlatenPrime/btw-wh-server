import { Types } from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../models/Event.js";
import { createEventUtil } from "../createEventUtil.js";

describe("createEventUtil", () => {
  beforeEach(async () => {
    await Event.deleteMany({});
  });

  it("creates event with userData snapshot", async () => {
    const user = await createTestUser({
      fullname: "Actor",
      telegram: "111",
      photo: "a.jpg",
    });

    const event = await createEventUtil({
      userId: user._id.toString(),
      department: "constants",
      description: "Создана константа config",
    });

    expect(event).not.toBeNull();
    expect(event!.userId.equals(user._id)).toBe(true);
    expect(event!.userData.fullname).toBe("Actor");
    expect(event!.userData.telegram).toBe("111");
    expect(event!.userData.photo).toBe("a.jpg");
    expect(event!.department).toBe("constants");
    expect(event!.description).toBe("Создана константа config");

    const found = await Event.findById(event!._id);
    expect(found).not.toBeNull();
  });

  it("trims department and description", async () => {
    const user = await createTestUser({ username: `trim-${Date.now()}` });

    const event = await createEventUtil({
      userId: user._id.toString(),
      department: "  poses  ",
      description: "  Updated pose  ",
    });

    expect(event).not.toBeNull();
    expect(event!.department).toBe("poses");
    expect(event!.description).toBe("Updated pose");
  });

  it("returns null for invalid userId", async () => {
    const event = await createEventUtil({
      userId: "not-an-object-id",
      department: "constants",
      description: "Should skip",
    });
    expect(event).toBeNull();
    expect(await Event.countDocuments()).toBe(0);
  });

  it("returns null when user not found", async () => {
    const event = await createEventUtil({
      userId: new Types.ObjectId().toString(),
      department: "constants",
      description: "Missing user",
    });
    expect(event).toBeNull();
    expect(await Event.countDocuments()).toBe(0);
  });

  it("returns null for empty department after trim", async () => {
    const user = await createTestUser({ username: `empty-dept-${Date.now()}` });
    const event = await createEventUtil({
      userId: user._id.toString(),
      department: "   ",
      description: "Has description",
    });
    expect(event).toBeNull();
    expect(await Event.countDocuments()).toBe(0);
  });

  it("returns null for empty description after trim", async () => {
    const user = await createTestUser({ username: `empty-desc-${Date.now()}` });
    const event = await createEventUtil({
      userId: user._id.toString(),
      department: "constants",
      description: "   ",
    });
    expect(event).toBeNull();
    expect(await Event.countDocuments()).toBe(0);
  });
});

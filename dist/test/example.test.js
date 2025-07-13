import { describe, expect, it } from "vitest";
describe("Example Test Suite", () => {
    it("should pass a basic test", () => {
        expect(1 + 1).toBe(2);
    });
    it("should handle string operations", () => {
        const message = "Hello, World!";
        expect(message).toContain("Hello");
        expect(message.length).toBeGreaterThan(0);
    });
    it("should work with arrays", () => {
        const numbers = [1, 2, 3, 4, 5];
        expect(numbers).toHaveLength(5);
        expect(numbers).toContain(3);
    });
    it("should work with objects", () => {
        const user = {
            name: "John",
            age: 30,
            email: "john@example.com",
        };
        expect(user).toHaveProperty("name");
        expect(user.name).toBe("John");
        expect(user.age).toBeGreaterThan(18);
    });
});

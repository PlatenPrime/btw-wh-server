import { describe, expect, it } from "vitest";
// Simple utility functions to test
const add = (a, b) => a + b;
const multiply = (a, b) => a * b;
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};
const validatePassword = (password) => {
    return (password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /\d/.test(password));
};
describe("Unit Tests", () => {
    describe("Math Operations", () => {
        it("should add two numbers correctly", () => {
            expect(add(2, 3)).toBe(5);
            expect(add(-1, 1)).toBe(0);
            expect(add(0, 0)).toBe(0);
        });
        it("should multiply two numbers correctly", () => {
            expect(multiply(2, 3)).toBe(6);
            expect(multiply(-2, 3)).toBe(-6);
            expect(multiply(0, 5)).toBe(0);
        });
    });
    describe("Email Validation", () => {
        it("should validate correct email addresses", () => {
            expect(validateEmail("test@example.com")).toBe(true);
            expect(validateEmail("user.name@domain.co.uk")).toBe(true);
            expect(validateEmail("user+tag@example.org")).toBe(true);
        });
        it("should reject invalid email addresses", () => {
            expect(validateEmail("invalid-email")).toBe(false);
            expect(validateEmail("test@")).toBe(false);
            expect(validateEmail("@example.com")).toBe(false);
            expect(validateEmail("")).toBe(false);
        });
    });
    describe("Password Validation", () => {
        it("should validate strong passwords", () => {
            expect(validatePassword("StrongPass123")).toBe(true);
            expect(validatePassword("MySecurePwd1")).toBe(true);
        });
        it("should reject weak passwords", () => {
            expect(validatePassword("weak")).toBe(false);
            expect(validatePassword("onlylowercase")).toBe(false);
            expect(validatePassword("ONLYUPPERCASE")).toBe(false);
            expect(validatePassword("12345678")).toBe(false);
        });
    });
    describe("Array Operations", () => {
        it("should filter arrays correctly", () => {
            const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const evenNumbers = numbers.filter((n) => n % 2 === 0);
            expect(evenNumbers).toEqual([2, 4, 6, 8, 10]);
        });
        it("should map arrays correctly", () => {
            const numbers = [1, 2, 3, 4, 5];
            const doubled = numbers.map((n) => n * 2);
            expect(doubled).toEqual([2, 4, 6, 8, 10]);
        });
    });
    describe("Object Operations", () => {
        it("should merge objects correctly", () => {
            const obj1 = { a: 1, b: 2 };
            const obj2 = { c: 3, d: 4 };
            const merged = { ...obj1, ...obj2 };
            expect(merged).toEqual({ a: 1, b: 2, c: 3, d: 4 });
        });
        it("should destructure objects correctly", () => {
            const user = { name: "John", age: 30, email: "john@example.com" };
            const { name, age } = user;
            expect(name).toBe("John");
            expect(age).toBe(30);
        });
    });
});

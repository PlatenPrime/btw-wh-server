import jwt from "jsonwebtoken";
export const generateAccessToken = (id, role) => {
    const payload = { id, role };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign(payload, secret);
};

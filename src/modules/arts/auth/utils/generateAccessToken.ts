import jwt from "jsonwebtoken";

export const generateAccessToken = (id: string, role: string): string => {
  const payload = { id, role };
  const secret = process.env.JWT_SECRET as string;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, secret);
};


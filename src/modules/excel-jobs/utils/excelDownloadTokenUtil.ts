import jwt from "jsonwebtoken";
import {
  EXCEL_DOWNLOAD_TOKEN_EXPIRES,
  EXCEL_DOWNLOAD_TOKEN_TYP,
} from "../constants/excelJobConstants.js";

export type ExcelDownloadTokenPayload = {
  typ: typeof EXCEL_DOWNLOAD_TOKEN_TYP;
  jobId: string;
  userId: string;
};

export function createExcelDownloadToken(jobId: string, userId: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }
  const payload: ExcelDownloadTokenPayload = {
    typ: EXCEL_DOWNLOAD_TOKEN_TYP,
    jobId,
    userId,
  };
  return jwt.sign(payload, secret, { expiresIn: EXCEL_DOWNLOAD_TOKEN_EXPIRES });
}

export function verifyExcelDownloadToken(
  token: string,
): ExcelDownloadTokenPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, secret) as Partial<ExcelDownloadTokenPayload>;
    if (
      decoded.typ !== EXCEL_DOWNLOAD_TOKEN_TYP ||
      typeof decoded.jobId !== "string" ||
      typeof decoded.userId !== "string"
    ) {
      return null;
    }
    return {
      typ: EXCEL_DOWNLOAD_TOKEN_TYP,
      jobId: decoded.jobId,
      userId: decoded.userId,
    };
  } catch {
    return null;
  }
}

import { describe, expect, it } from "vitest";
import {
  createExcelDownloadToken,
  verifyExcelDownloadToken,
} from "../excelDownloadTokenUtil.js";

describe("excelDownloadTokenUtil", () => {
  it("roundtrips jobId and userId", () => {
    const token = createExcelDownloadToken("job-1", "user-1");
    expect(verifyExcelDownloadToken(token)).toEqual({
      typ: "excel-dl",
      jobId: "job-1",
      userId: "user-1",
    });
  });

  it("rejects access tokens and garbage", () => {
    expect(verifyExcelDownloadToken("not-a-jwt")).toBeNull();
  });
});

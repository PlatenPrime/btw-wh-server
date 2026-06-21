import { afterEach, describe, expect, it } from "vitest";

import { getLogFormat } from "../getLogFormat.js";
import { getLogLevel } from "../getLogLevel.js";
import { isHttpLogEnabled } from "../isHttpLogEnabled.js";

describe("getLogLevel", () => {
  const originalLevel = process.env.LOG_LEVEL;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    if (originalLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLevel;
    }
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("возвращает значение из LOG_LEVEL", () => {
    process.env.LOG_LEVEL = "warn";
    expect(getLogLevel()).toBe("warn");
  });

  it("info в production без env", () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = "production";
    expect(getLogLevel()).toBe("info");
  });

  it("debug вне production без env", () => {
    delete process.env.LOG_LEVEL;
    process.env.NODE_ENV = "development";
    expect(getLogLevel()).toBe("debug");
  });
});

describe("getLogFormat", () => {
  const originalFormat = process.env.LOG_FORMAT;

  afterEach(() => {
    if (originalFormat === undefined) {
      delete process.env.LOG_FORMAT;
    } else {
      process.env.LOG_FORMAT = originalFormat;
    }
  });

  it("json по умолчанию", () => {
    delete process.env.LOG_FORMAT;
    expect(getLogFormat()).toBe("json");
  });

  it("pretty при LOG_FORMAT=pretty", () => {
    process.env.LOG_FORMAT = "pretty";
    expect(getLogFormat()).toBe("pretty");
  });
});

describe("isHttpLogEnabled", () => {
  const original = process.env.LOG_HTTP;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.LOG_HTTP;
    } else {
      process.env.LOG_HTTP = original;
    }
  });

  it("true по умолчанию", () => {
    delete process.env.LOG_HTTP;
    expect(isHttpLogEnabled()).toBe(true);
  });

  it.each(["0", "false", "no", "off"])(
    "false при LOG_HTTP=%s",
    (value) => {
      process.env.LOG_HTTP = value;
      expect(isHttpLogEnabled()).toBe(false);
    }
  );
});

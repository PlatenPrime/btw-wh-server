import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as getServerEgressGeoModule from "../getServerEgressGeo.js";
import {
  isServerEgressGeoLogEnabled,
  logServerEgressGeo,
} from "../logServerEgressGeo.js";

const mockLogger = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("../../../logging/createLogger.js", () => ({
  createLogger: () => mockLogger,
}));

describe("isServerEgressGeoLogEnabled", () => {
  afterEach(() => {
    delete process.env.SERVER_EGRESS_GEO_LOG;
  });

  it("true когда env не задан", () => {
    expect(isServerEgressGeoLogEnabled()).toBe(true);
  });

  it("true когда SERVER_EGRESS_GEO_LOG=1", () => {
    process.env.SERVER_EGRESS_GEO_LOG = "1";
    expect(isServerEgressGeoLogEnabled()).toBe(true);
  });

  it.each(["0", "false", "no", "off"])(
    "false когда SERVER_EGRESS_GEO_LOG=%s",
    (value) => {
      process.env.SERVER_EGRESS_GEO_LOG = value;
      expect(isServerEgressGeoLogEnabled()).toBe(false);
    }
  );
});

describe("logServerEgressGeo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.SERVER_EGRESS_GEO_LOG;
  });

  afterEach(() => {
    delete process.env.SERVER_EGRESS_GEO_LOG;
    vi.restoreAllMocks();
  });

  it("no-op при SERVER_EGRESS_GEO_LOG=0", async () => {
    process.env.SERVER_EGRESS_GEO_LOG = "0";
    const getGeoSpy = vi.spyOn(getServerEgressGeoModule, "getServerEgressGeo");

    await logServerEgressGeo("createRow");

    expect(getGeoSpy).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
  });

  it("логирует geo при успехе без env", async () => {
    vi.spyOn(getServerEgressGeoModule, "getServerEgressGeo").mockResolvedValue({
      ip: "203.0.113.1",
      country: "United States",
      countryCode: "US",
      city: "Ashburn",
    });

    await logServerEgressGeo("createRow");

    expect(mockLogger.info).toHaveBeenCalledWith(
      {
        context: "createRow",
        geo: {
          ip: "203.0.113.1",
          country: "United States",
          countryCode: "US",
          city: "Ashburn",
        },
      },
      "server egress geo"
    );
  });

  it("warn при отсутствии geo", async () => {
    vi.spyOn(getServerEgressGeoModule, "getServerEgressGeo").mockResolvedValue(
      null
    );

    await logServerEgressGeo("createRow");

    expect(mockLogger.warn).toHaveBeenCalledWith(
      { context: "createRow" },
      "server egress geo unavailable"
    );
  });
});

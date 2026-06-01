import axios from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getServerEgressGeo } from "../getServerEgressGeo.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("getServerEgressGeo", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.SERVER_EGRESS_GEO_URL;
  });

  it("возвращает нормализованный geo при успешном ответе ipapi.co", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        ip: "203.0.113.1",
        country_name: "United States",
        country_code: "US",
        city: "Ashburn",
        region: "Virginia",
      },
    });

    const result = await getServerEgressGeo();

    expect(result).toEqual({
      ip: "203.0.113.1",
      country: "United States",
      countryCode: "US",
      city: "Ashburn",
      region: "Virginia",
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://ipapi.co/json/",
      expect.objectContaining({ timeout: 5000 })
    );
  });

  it("использует SERVER_EGRESS_GEO_URL при заданном env", async () => {
    process.env.SERVER_EGRESS_GEO_URL = "https://custom.example/geo";
    mockedAxios.get.mockResolvedValue({
      data: {
        ip: "1.2.3.4",
        country_name: "Ukraine",
        country_code: "UA",
      },
    });

    await getServerEgressGeo();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://custom.example/geo",
      expect.objectContaining({ timeout: 5000 })
    );
  });

  it("возвращает null при error в теле ответа", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { error: true, reason: "RateLimited" },
    });

    expect(await getServerEgressGeo()).toBeNull();
  });

  it("возвращает null при сетевой ошибке", async () => {
    mockedAxios.get.mockRejectedValue(new Error("timeout"));

    expect(await getServerEgressGeo()).toBeNull();
  });
});

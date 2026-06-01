import axios from "axios";
import type { ServerEgressGeo } from "./types.js";

const DEFAULT_GEO_URL = "https://ipapi.co/json/";
const GEO_REQUEST_TIMEOUT_MS = 5_000;

type IpApiCoResponse = {
  ip?: string;
  country_name?: string;
  country_code?: string;
  city?: string;
  region?: string;
  error?: boolean;
  reason?: string;
};

/**
 * Определяет страну/город по исходящему (egress) IP сервера через внешний geo-API.
 * Не бросает — при ошибке возвращает null.
 */
export async function getServerEgressGeo(): Promise<ServerEgressGeo | null> {
  const url = process.env.SERVER_EGRESS_GEO_URL?.trim() || DEFAULT_GEO_URL;

  try {
    const response = await axios.get<IpApiCoResponse>(url, {
      timeout: GEO_REQUEST_TIMEOUT_MS,
    });
    const data = response.data;

    if (data.error || !data.ip || !data.country_name || !data.country_code) {
      return null;
    }

    const geo: ServerEgressGeo = {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
    };

    if (data.city) {
      geo.city = data.city;
    }
    if (data.region) {
      geo.region = data.region;
    }

    return geo;
  } catch {
    return null;
  }
}

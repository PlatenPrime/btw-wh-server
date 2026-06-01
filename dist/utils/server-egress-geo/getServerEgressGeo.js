import axios from "axios";
const DEFAULT_GEO_URL = "https://ipapi.co/json/";
const GEO_REQUEST_TIMEOUT_MS = 5_000;
/**
 * Определяет страну/город по исходящему (egress) IP сервера через внешний geo-API.
 * Не бросает — при ошибке возвращает null.
 */
export async function getServerEgressGeo() {
    const url = process.env.SERVER_EGRESS_GEO_URL?.trim() || DEFAULT_GEO_URL;
    try {
        const response = await axios.get(url, {
            timeout: GEO_REQUEST_TIMEOUT_MS,
        });
        const data = response.data;
        if (data.error || !data.ip || !data.country_name || !data.country_code) {
            return null;
        }
        const geo = {
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
    }
    catch {
        return null;
    }
}

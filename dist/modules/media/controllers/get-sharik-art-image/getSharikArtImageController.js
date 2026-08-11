import { createLogger } from "../../../../logging/createLogger.js";
import { getCachedSharikArtImage } from "../../utils/cache/getCachedSharikArtImage.js";
import { SHARIK_ART_IMAGE_HTTP_CACHE_CONTROL } from "../../utils/cache/constants.js";
import { SharikArtImageNotFoundError, SharikArtImageUpstreamError, } from "../../utils/fetch-sharik-art-image/fetchSharikArtImage.js";
import { getSharikArtImageSchema } from "./schemas/getSharikArtImageSchema.js";
const mediaLog = createLogger({ module: "media" });
/**
 * @desc    Публичный proxy JPEG артикула с sharik.ua
 * @route   GET /api/media/sharik/:artikul?size=prev|big
 */
export const getSharikArtImageController = async (req, res) => {
    try {
        const parseResult = getSharikArtImageSchema.safeParse({
            artikul: req.params.artikul,
            size: req.query.size,
        });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { artikul, size } = parseResult.data;
        const entry = await getCachedSharikArtImage(artikul, size);
        const ifNoneMatch = req.headers["if-none-match"];
        if (typeof ifNoneMatch === "string" &&
            ifNoneMatch.trim() === entry.etag) {
            res.setHeader("ETag", entry.etag);
            res.setHeader("Cache-Control", SHARIK_ART_IMAGE_HTTP_CACHE_CONTROL);
            res.status(304).end();
            return;
        }
        res.setHeader("Content-Type", entry.contentType);
        res.setHeader("Cache-Control", SHARIK_ART_IMAGE_HTTP_CACHE_CONTROL);
        res.setHeader("ETag", entry.etag);
        res.status(200).send(entry.buffer);
    }
    catch (error) {
        if (error instanceof SharikArtImageNotFoundError) {
            res.status(404).json({
                message: "Image not found",
            });
            return;
        }
        if (error instanceof SharikArtImageUpstreamError) {
            mediaLog.warn({ details: error.message }, "sharik art image upstream failed");
            res.status(502).json({
                message: "Upstream image fetch failed",
            });
            return;
        }
        mediaLog.error({
            details: error instanceof Error ? error.message : String(error),
        }, "sharik art image unexpected error");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

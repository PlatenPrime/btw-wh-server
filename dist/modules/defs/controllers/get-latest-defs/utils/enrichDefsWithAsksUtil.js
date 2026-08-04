import { Ask } from "../../../../asks/models/Ask.js";
/**
 * Обогащает дефициты информацией о существующих активных заявках
 */
export async function enrichDefsWithAsksUtil(result) {
    const artikuls = Object.keys(result);
    const existingAsks = await Ask.find({
        artikul: { $in: artikuls },
        status: { $in: ["new"] },
    })
        .select("artikul status createdAt askerData.fullname askerData._id")
        .lean();
    const asksByArtikul = existingAsks.reduce((acc, ask) => {
        if (!acc[ask.artikul]) {
            acc[ask.artikul] = {
                _id: ask._id.toString(),
                status: ask.status,
                createdAt: ask.createdAt,
                askerName: ask.askerData.fullname,
                askerId: ask.askerData._id.toString(),
            };
        }
        return acc;
    }, {});
    const resultWithAsks = Object.keys(result).reduce((acc, artikul) => {
        acc[artikul] = {
            ...result[artikul],
            existingAsk: asksByArtikul[artikul] || null,
        };
        return acc;
    }, {});
    return resultWithAsks;
}

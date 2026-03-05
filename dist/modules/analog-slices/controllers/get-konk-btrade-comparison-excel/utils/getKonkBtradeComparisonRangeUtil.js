import { Analog } from "../../../../analogs/models/Analog.js";
import { Art } from "../../../../arts/models/Art.js";
import { Prod } from "../../../../prods/models/Prod.js";
import { BtradeSlice, } from "../../../../btrade-slices/models/BtradeSlice.js";
import { AnalogSlice, } from "../../../models/AnalogSlice.js";
import { Konk } from "../../../../konks/models/Konk.js";
import { toSliceDate } from "../../../utils/runAnalogSliceForKonkUtil.js";
export async function getKonkBtradeComparisonRangeUtil(input) {
    const dateFrom = toSliceDate(input.dateFrom);
    const dateTo = toSliceDate(input.dateTo);
    const analogDocs = await Analog.find({
        konkName: input.konk,
        prodName: input.prod,
    })
        .select("_id artikul konkName prodName")
        .lean();
    const preparedAnalogs = analogDocs
        .map((doc) => {
        const artikul = doc.artikul?.trim() ?? "";
        if (!artikul)
            return null;
        return {
            analogId: doc._id.toString(),
            konkName: doc.konkName,
            prodName: doc.prodName,
            artikul,
        };
    })
        .filter((item) => item !== null);
    if (preparedAnalogs.length === 0) {
        return { ok: false };
    }
    const artikulSet = new Set();
    const prodNameSet = new Set();
    for (const analog of preparedAnalogs) {
        artikulSet.add(analog.artikul);
        prodNameSet.add(analog.prodName);
    }
    const artikulList = Array.from(artikulSet);
    const prodNameList = Array.from(prodNameSet);
    const [artDocs, prodDocs, konkDoc] = await Promise.all([
        Art.find({ artikul: { $in: artikulList } }).select("artikul nameukr").lean(),
        Prod.find({ name: { $in: prodNameList } }).select("name title").lean(),
        Konk.findOne({ name: input.konk }).select("title").lean(),
    ]);
    const artNameByArtikul = new Map();
    for (const art of artDocs) {
        const artikul = (art.artikul ?? "").trim();
        const name = (art.nameukr ?? "").trim() || null;
        if (!artikul)
            continue;
        artNameByArtikul.set(artikul, name);
    }
    const producerTitleByProdName = new Map();
    for (const prod of prodDocs) {
        const name = (prod.name ?? "").trim();
        const title = (prod.title ?? "").trim() || null;
        if (!name)
            continue;
        producerTitleByProdName.set(name, title);
    }
    const competitorTitle = (konkDoc?.title ?? "").trim() || null;
    const analogSlices = await AnalogSlice.find({
        konkName: input.konk,
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .lean();
    const analogByArtikulAndDate = new Map();
    for (const slice of analogSlices) {
        const normalizedDate = toSliceDate(slice.date);
        const dateKey = normalizedDate.getTime();
        const dataRecord = (slice.data ?? {});
        for (const [artikul, item] of Object.entries(dataRecord)) {
            if (!artikulSet.has(artikul))
                continue;
            let byDate = analogByArtikulAndDate.get(artikul);
            if (!byDate) {
                byDate = new Map();
                analogByArtikulAndDate.set(artikul, byDate);
            }
            byDate.set(dateKey, item);
        }
    }
    const btradeSlices = await BtradeSlice.find({
        date: { $gte: dateFrom, $lte: dateTo },
    })
        .select("date data")
        .lean();
    const btradeByArtikulAndDate = new Map();
    for (const slice of btradeSlices) {
        const normalizedDate = toSliceDate(slice.date);
        const dateKey = normalizedDate.getTime();
        const dataRecord = (slice.data ?? {});
        for (const [artikul, item] of Object.entries(dataRecord)) {
            if (!artikulSet.has(artikul))
                continue;
            let byDate = btradeByArtikulAndDate.get(artikul);
            if (!byDate) {
                byDate = new Map();
                btradeByArtikulAndDate.set(artikul, byDate);
            }
            byDate.set(dateKey, item);
        }
    }
    const dateKeys = [];
    {
        const cursor = new Date(dateFrom);
        while (cursor.getTime() <= dateTo.getTime()) {
            dateKeys.push(cursor.getTime());
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
    }
    const analogs = preparedAnalogs
        .slice()
        .sort((a, b) => a.artikul.localeCompare(b.artikul))
        .map((analog) => {
        const artNameUkr = artNameByArtikul.get(analog.artikul) ?? null;
        const producerName = producerTitleByProdName.get(analog.prodName) ?? null;
        const analogByDate = analogByArtikulAndDate.get(analog.artikul) ?? new Map();
        const btradeByDate = btradeByArtikulAndDate.get(analog.artikul) ?? new Map();
        const items = dateKeys.map((time) => {
            const date = new Date(time);
            const analogItem = analogByDate.get(time);
            const btradeItem = btradeByDate.get(time);
            return {
                date,
                analogStock: analogItem?.stock ?? null,
                analogPrice: analogItem?.price ?? null,
                btradeStock: btradeItem?.quantity ?? null,
                btradePrice: btradeItem?.price ?? null,
            };
        });
        return {
            analogId: analog.analogId,
            artikul: analog.artikul,
            artNameUkr,
            producerName,
            competitorTitle,
            items,
        };
    });
    if (analogs.length === 0) {
        return { ok: false };
    }
    return {
        ok: true,
        analogs,
        dateFrom,
        dateTo,
        konk: input.konk,
        prod: input.prod,
    };
}

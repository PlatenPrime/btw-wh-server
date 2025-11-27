import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Seg } from "../../../segs/models/Seg.js";
import { Zone } from "../../../zones/models/Zone.js";
import { Block } from "../../models/Block.js";
import { calculateZonesSectorsUtil } from "../calculateZonesSectorsUtil.js";
describe("calculateZonesSectorsUtil", () => {
    // Set для отслеживания созданных title
    const usedTitles = new Set();
    const createZone = async (overrides = {}) => {
        let title = overrides.title;
        if (!title) {
            // Генерируем уникальный title, проверяя его в Set
            let attempt = 0;
            do {
                const firstSegment = Math.floor(attempt / 99) + 1;
                const secondSegment = (attempt % 99) + 1;
                title = `42-${firstSegment}-${secondSegment}`;
                attempt++;
                // Защита от бесконечного цикла (на случай если все комбинации заняты)
                if (attempt > 10000) {
                    // Используем timestamp как fallback
                    title = `42-${(Date.now() % 99) + 1}-${Math.floor(Math.random() * 99) + 1}`;
                    break;
                }
            } while (usedTitles.has(title));
            usedTitles.add(title);
        }
        else {
            // Если title передан явно, тоже проверяем уникальность
            if (usedTitles.has(title)) {
                throw new Error(`Zone with title "${title}" already exists in this test`);
            }
            usedTitles.add(title);
        }
        return Zone.create({
            title,
            bar: overrides.bar ?? Math.max(1, Math.floor(Math.random() * 1_000_000)),
            sector: overrides.sector ?? 0,
        });
    };
    // Очищаем Set перед каждым тестом
    beforeEach(() => {
        usedTitles.clear();
    });
    it("рассчитывает сектора для блоков с сегментами и зонами", async () => {
        // Создаем блоки
        const block1 = await Block.create({ title: "Block 1", order: 1, segs: [] });
        const block2 = await Block.create({ title: "Block 2", order: 2, segs: [] });
        // Создаем зоны
        const zone1 = await createZone();
        const zone2 = await createZone();
        const zone3 = await createZone();
        const zone4 = await createZone();
        // Создаем сегменты
        const seg1 = await Seg.create({
            block: block1._id,
            blockData: { _id: block1._id, title: block1.title },
            order: 1,
            sector: 0,
            zones: [zone1._id, zone2._id],
        });
        const seg2 = await Seg.create({
            block: block1._id,
            blockData: { _id: block1._id, title: block1.title },
            order: 2,
            sector: 0,
            zones: [zone3._id],
        });
        const seg3 = await Seg.create({
            block: block2._id,
            blockData: { _id: block2._id, title: block2.title },
            order: 1,
            sector: 0,
            zones: [zone4._id],
        });
        // Выполняем расчет
        const result = await calculateZonesSectorsUtil();
        // Проверяем результат
        expect(result.blocksProcessed).toBe(2);
        expect(result.updatedSegs).toBe(3);
        expect(result.updatedZones).toBe(4);
        // Проверяем сектора сегментов
        const updatedSeg1 = await Seg.findById(seg1._id).lean().exec();
        const updatedSeg2 = await Seg.findById(seg2._id).lean().exec();
        const updatedSeg3 = await Seg.findById(seg3._id).lean().exec();
        expect(updatedSeg1?.sector).toBe(1001); // block1.order * 1000 + seg1.order = 1 * 1000 + 1
        expect(updatedSeg2?.sector).toBe(1002); // block1.order * 1000 + seg2.order = 1 * 1000 + 2
        expect(updatedSeg3?.sector).toBe(2001); // block2.order * 1000 + seg3.order = 2 * 1000 + 1
        // Проверяем сектора зон
        const updatedZone1 = await Zone.findById(zone1._id).lean().exec();
        const updatedZone2 = await Zone.findById(zone2._id).lean().exec();
        const updatedZone3 = await Zone.findById(zone3._id).lean().exec();
        const updatedZone4 = await Zone.findById(zone4._id).lean().exec();
        expect(updatedZone1?.sector).toBe(1001);
        expect(updatedZone2?.sector).toBe(1001);
        expect(updatedZone3?.sector).toBe(1002);
        expect(updatedZone4?.sector).toBe(2001);
    });
    it("устанавливает sector = 0 для зон без сегмента", async () => {
        // Создаем блок
        const block = await Block.create({ title: "Block 1", order: 1, segs: [] });
        // Создаем зоны: одна с сегментом, одна без
        const zoneWithSeg = await createZone({ sector: 1001 });
        const zoneWithoutSeg = await createZone({ sector: 5000 });
        // Создаем сегмент только для одной зоны
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 0,
            zones: [zoneWithSeg._id],
        });
        // Выполняем расчет
        const result = await calculateZonesSectorsUtil();
        // Проверяем результат
        expect(result.updatedZones).toBe(2); // обе зоны обновлены
        // Проверяем, что зона с сегментом получила правильный сектор
        const updatedZoneWithSeg = await Zone.findById(zoneWithSeg._id)
            .lean()
            .exec();
        expect(updatedZoneWithSeg?.sector).toBe(1001);
        // Проверяем, что зона без сегмента получила sector = 0
        const updatedZoneWithoutSeg = await Zone.findById(zoneWithoutSeg._id)
            .lean()
            .exec();
        expect(updatedZoneWithoutSeg?.sector).toBe(0);
    });
    it("правильно рассчитывает сектора для блоков с разными order", async () => {
        // Создаем блоки с разными order
        const block1 = await Block.create({ title: "Block 1", order: 1, segs: [] });
        const block3 = await Block.create({ title: "Block 3", order: 3, segs: [] });
        const block5 = await Block.create({ title: "Block 5", order: 5, segs: [] });
        const zone1 = await createZone();
        const zone2 = await createZone();
        const zone3 = await createZone();
        // Создаем сегменты с order = 1 для каждого блока
        const seg1 = await Seg.create({
            block: block1._id,
            blockData: { _id: block1._id, title: block1.title },
            order: 1,
            sector: 0,
            zones: [zone1._id],
        });
        const seg2 = await Seg.create({
            block: block3._id,
            blockData: { _id: block3._id, title: block3.title },
            order: 1,
            sector: 0,
            zones: [zone2._id],
        });
        const seg3 = await Seg.create({
            block: block5._id,
            blockData: { _id: block5._id, title: block5.title },
            order: 1,
            sector: 0,
            zones: [zone3._id],
        });
        // Выполняем расчет
        await calculateZonesSectorsUtil();
        // Проверяем сектора
        const updatedSeg1 = await Seg.findById(seg1._id).lean().exec();
        const updatedSeg2 = await Seg.findById(seg2._id).lean().exec();
        const updatedSeg3 = await Seg.findById(seg3._id).lean().exec();
        expect(updatedSeg1?.sector).toBe(1001); // 1 * 1000 + 1
        expect(updatedSeg2?.sector).toBe(3001); // 3 * 1000 + 1
        expect(updatedSeg3?.sector).toBe(5001); // 5 * 1000 + 1
    });
    it("обрабатывает блоки без сегментов", async () => {
        // Создаем блоки: один с сегментом, один без
        const blockWithSeg = await Block.create({
            title: "Block With Seg",
            order: 1,
            segs: [],
        });
        const blockWithoutSeg = await Block.create({
            title: "Block Without Seg",
            order: 2,
            segs: [],
        });
        const zone = await createZone();
        // Создаем сегмент только для одного блока
        await Seg.create({
            block: blockWithSeg._id,
            blockData: { _id: blockWithSeg._id, title: blockWithSeg.title },
            order: 1,
            sector: 0,
            zones: [zone._id],
        });
        // Выполняем расчет
        const result = await calculateZonesSectorsUtil();
        // Проверяем, что обработаны оба блока
        expect(result.blocksProcessed).toBe(2);
        expect(result.updatedSegs).toBe(1); // только один сегмент
        expect(result.updatedZones).toBe(1); // только одна зона
    });
    it("обрабатывает сегменты без зон", async () => {
        // Создаем блок
        const block = await Block.create({ title: "Block 1", order: 1, segs: [] });
        // Создаем сегмент без зон
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 0,
            zones: [],
        });
        // Выполняем расчет
        const result = await calculateZonesSectorsUtil();
        // Проверяем результат
        expect(result.blocksProcessed).toBe(1);
        expect(result.updatedSegs).toBe(1);
        expect(result.updatedZones).toBe(0); // нет зон для обновления
        // Проверяем, что сектор сегмента рассчитан правильно
        const updatedSeg = await Seg.findById(seg._id).lean().exec();
        expect(updatedSeg?.sector).toBe(1001);
    });
    it("правильно сортирует блоки и сегменты по order", async () => {
        // Создаем блоки в неправильном порядке
        const block3 = await Block.create({ title: "Block 3", order: 3, segs: [] });
        const block1 = await Block.create({ title: "Block 1", order: 1, segs: [] });
        const block2 = await Block.create({ title: "Block 2", order: 2, segs: [] });
        const zone1 = await createZone();
        const zone2 = await createZone();
        const zone3 = await createZone();
        // Создаем сегменты в неправильном порядке
        const seg2 = await Seg.create({
            block: block1._id,
            blockData: { _id: block1._id, title: block1.title },
            order: 2,
            sector: 0,
            zones: [zone1._id],
        });
        const seg1 = await Seg.create({
            block: block1._id,
            blockData: { _id: block1._id, title: block1.title },
            order: 1,
            sector: 0,
            zones: [zone2._id],
        });
        const seg3 = await Seg.create({
            block: block2._id,
            blockData: { _id: block2._id, title: block2.title },
            order: 1,
            sector: 0,
            zones: [zone3._id],
        });
        // Выполняем расчет
        await calculateZonesSectorsUtil();
        // Проверяем, что сектора рассчитаны правильно с учетом сортировки
        const updatedSeg1 = await Seg.findById(seg1._id).lean().exec();
        const updatedSeg2 = await Seg.findById(seg2._id).lean().exec();
        const updatedSeg3 = await Seg.findById(seg3._id).lean().exec();
        expect(updatedSeg1?.sector).toBe(1001); // block1.order * 1000 + seg1.order = 1 * 1000 + 1
        expect(updatedSeg2?.sector).toBe(1002); // block1.order * 1000 + seg2.order = 1 * 1000 + 2
        expect(updatedSeg3?.sector).toBe(2001); // block2.order * 1000 + seg3.order = 2 * 1000 + 1
    });
    it("обрабатывает пустую базу данных", async () => {
        // Выполняем расчет без данных
        const result = await calculateZonesSectorsUtil();
        // Проверяем результат
        expect(result.blocksProcessed).toBe(0);
        expect(result.updatedSegs).toBe(0);
        expect(result.updatedZones).toBe(0);
    });
    it("обрабатывает множественные зоны в одном сегменте", async () => {
        // Создаем блок
        const block = await Block.create({ title: "Block 1", order: 1, segs: [] });
        // Создаем несколько зон
        const zones = await Promise.all([
            createZone(),
            createZone(),
            createZone(),
            createZone(),
            createZone(),
        ]);
        // Создаем сегмент со всеми зонами
        const seg = await Seg.create({
            block: block._id,
            blockData: { _id: block._id, title: block.title },
            order: 1,
            sector: 0,
            zones: zones.map((z) => z._id),
        });
        // Выполняем расчет
        const result = await calculateZonesSectorsUtil();
        // Проверяем результат
        expect(result.updatedSegs).toBe(1);
        expect(result.updatedZones).toBe(5); // все 5 зон обновлены
        // Проверяем, что все зоны получили правильный сектор
        for (const zone of zones) {
            const updatedZone = await Zone.findById(zone._id).lean().exec();
            expect(updatedZone?.sector).toBe(1001);
        }
        // Проверяем сектор сегмента
        const updatedSeg = await Seg.findById(seg._id).lean().exec();
        expect(updatedSeg?.sector).toBe(1001);
    });
});

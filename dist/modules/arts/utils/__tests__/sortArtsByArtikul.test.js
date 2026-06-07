import { describe, expect, it } from "vitest";
import { sortArtsByArtikul } from "../sortArtsByArtikul.js";
describe("sortArtsByArtikul", () => {
    it("сортирует артикулы по artikul в алфавитном порядке", () => {
        const arts = [
            { artikul: "ART-003" },
            { artikul: "ART-001" },
            { artikul: "ART-002" },
        ];
        const sorted = sortArtsByArtikul(arts);
        expect(sorted.map((art) => art.artikul)).toEqual([
            "ART-001",
            "ART-002",
            "ART-003",
        ]);
    });
    it("возвращает пустой массив без изменений", () => {
        const arts = [];
        expect(sortArtsByArtikul(arts)).toEqual([]);
    });
    it("сортирует in-place и возвращает тот же массив", () => {
        const arts = [{ artikul: "B" }, { artikul: "A" }];
        const result = sortArtsByArtikul(arts);
        expect(result).toBe(arts);
        expect(arts[0].artikul).toBe("A");
    });
});

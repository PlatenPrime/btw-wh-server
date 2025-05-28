import axios from "axios";
import * as cheerio from "cheerio";
export const getBtradeArtInfo = async (req, res) => {
    const { artikul } = req.params;
    try {
        if (!artikul) {
            res.status(400).json({ message: "Artikul is required" });
            return;
        }
        const targetUrl = `https://sharik.ua/ua/search/?q=${artikul}`;
        const { data: html } = await axios.get(targetUrl);
        const $ = cheerio.load(html);
        const productElements = $(".car-col .one-item");
        if (productElements.length === 0) {
            res.status(404).json({ message: "No products found for this artikul" });
            return;
        }
        const firstElement = productElements.eq(0); // eq возвращает Cheerio<cheerio.Element>
        const data = parseArtikulElement(firstElement);
        if (!data) {
            res.status(404).json({ message: "Product data not found or incomplete" });
            return;
        }
        res.json(data);
    }
    catch (error) {
        console.error("Parsing error:", error);
        res.status(500).json({ message: "Parsing Btrade artikul failed", error });
    }
};
function parseArtikulElement(artElement) {
    const nameukr = artElement.find(".one-item-tit").text().trim();
    const priceRaw = artElement.find(".one-item-price").text().trim();
    const quantityRaw = artElement.find(".one-item-quantity").text().trim();
    if (!nameukr || !priceRaw || !quantityRaw) {
        console.warn("Incomplete product data:", {
            nameukr,
            priceRaw,
            quantityRaw,
        });
        return;
    }
    const priceStr = priceRaw.replace(/[^\d.,]/g, "").replace(",", ".");
    const price = parseFloat(priceStr);
    const quantityMatch = quantityRaw.match(/\d+/);
    const quantity = quantityMatch ? parseInt(quantityMatch[0], 10) : 0;
    if (isNaN(price) || isNaN(quantity)) {
        console.warn("Invalid number parsed:", { priceStr, quantityRaw });
        return;
    }
    return { nameukr, price, quantity };
}

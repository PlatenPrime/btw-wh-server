import { describe, expect, it } from "vitest";
import { resolvePackCount } from "../perfectPackCount.js";

describe("resolvePackCount", () => {
  it("reads count from title with шт in parentheses", () => {
    expect(resolvePackCount("Кулька 10 шт. в уп.", "")).toBe(10);
  });

  it("reads count from title with шт without parens", () => {
    expect(resolvePackCount("50 шт упаковка", "")).toBe(50);
  });

  it("prefers title over HTML block", () => {
    const html = "<p>Штук в упаковці: 100</p>";
    expect(resolvePackCount("Кулька 10 шт", html)).toBe(10);
  });

  it("uses Штук в упаковці when title has no pack", () => {
    const html = "<p>Штук в упаковці: 100</p>";
    expect(resolvePackCount("Кулька Gemar пастель", html)).toBe(100);
  });

  it("reads pack from #main infoblock and ignores related product-miniature", () => {
    const html = `
      <section id="main">
        <div class="infoblock"><p class="infoblock_pp">Штук в упаковці: 50</p></div>
        <article class="product-miniature js-product-miniature">
          <p class="infoblock_p">Штук в упаковці: 100</p>
        </article>
      </section>`;
    expect(resolvePackCount("Кулька без шт в назві", html)).toBe(50);
  });

  it("returns null when pack exists only in related product-miniature", () => {
    const html = `
      <section id="main">
        <h1>Повітряна кулька Art Show 36"</h1>
        <div class="product-prices"><span class="current-price-value" content="69">69 грн.</span></div>
        <article class="product-miniature js-product-miniature">
          <span class="price">102 грн.</span>
          <p class="infoblock_p">Штук в упаковці: 100</p>
        </article>
        <article class="product-miniature js-product-miniature">
          <p class="infoblock_p">Штук в упаковці: 50</p>
        </article>
      </section>`;
    expect(resolvePackCount("Повітряна кулька Art Show 36\"", html)).toBeNull();
  });

  it("returns null when neither source has pack", () => {
    expect(resolvePackCount("Без фасовки", "<div>no</div>")).toBeNull();
    expect(resolvePackCount("Без фасовки", undefined)).toBeNull();
  });
});

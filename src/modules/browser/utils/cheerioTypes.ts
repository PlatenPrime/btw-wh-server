import type { Cheerio, CheerioAPI } from "cheerio";
import type { AnyNode } from "domhandler";

/** Результат `cheerio.load(...)`. */
export type BrowserCheerioAPI = CheerioAPI;

/** Selection (`$('.x')`, `$(el)`). Cheerio 1.x требует type arg. */
export type BrowserCheerio = Cheerio<AnyNode>;

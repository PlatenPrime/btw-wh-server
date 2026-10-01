/**
 * Фейковый остаток balun (Prom.ua cart clamp / глюк сайта): inclusive диапазон.
 * Post-pass после срезов и historical util заменяют его на адекватный stock слева.
 */
export const BALUN_FAKE_STOCK_MIN = 9950;
export const BALUN_FAKE_STOCK_MAX = 10000;

/** Сколько дней до окна коррекции грузить, чтобы найти адекватный stock слева. */
export const BALUN_FAKE_STOCK_LOOKBACK_DAYS = 90;

export const BALUN_FAKE_STOCK_KONK_NAME = "balun";

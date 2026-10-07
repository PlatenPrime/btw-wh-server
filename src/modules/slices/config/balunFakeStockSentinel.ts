/**
 * Фейковый остаток balun (Prom.ua cart clamp / глюк сайта):
 * inclusive диапазоны spike ∪ clamp.
 * Post-pass после срезов и historical util заменяют его на адекватный stock
 * (слева, иначе справа).
 */
export const BALUN_FAKE_STOCK_SPIKE_MIN = 4990;
export const BALUN_FAKE_STOCK_SPIKE_MAX = 5000;

export const BALUN_FAKE_STOCK_MIN = 9950;
export const BALUN_FAKE_STOCK_MAX = 10000;

/** Сколько дней до окна коррекции грузить, чтобы найти адекватный stock слева. */
export const BALUN_FAKE_STOCK_LOOKBACK_DAYS = 90;

/**
 * Ширина окна коррекции в cron и default CLI `--days-back`:
 * включает день ключа среза и 6 предыдущих, чтобы правый сосед
 * следующего дня мог починить вчерашний fake spike.
 */
export const BALUN_FAKE_STOCK_CRON_DAYS_BACK = 7;

export const BALUN_FAKE_STOCK_KONK_NAME = "balun";

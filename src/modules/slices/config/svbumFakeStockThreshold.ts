/**
 * Порог фейкового остатка svbum: stock строго больше THRESHOLD считается глюком.
 * Post-pass и historical util обнуляют такие точки и дни между парными спайками.
 */
export const SVBUM_FAKE_STOCK_THRESHOLD = 900_000;

/**
 * Сколько календарных дней справа от хвостового спайка нужно, чтобы обнулить его
 * без второго спайка. 1 = игла «норма — fake — норма» закрывается на следующий день
 * (ждём один день справа; на asOf без правого соседа ещё не трогаем).
 */
export const SVBUM_FAKE_STOCK_TRAILING_GRACE_DAYS = 1;

/** Сколько дней до окна коррекции грузить для контекста спайков слева. */
export const SVBUM_FAKE_STOCK_LOOKBACK_DAYS = 90;

/**
 * Ширина окна коррекции в cron и default CLI `--days-back`:
 * включает день ключа среза и предыдущие 13 (сэндвич + trailing grace).
 */
export const SVBUM_FAKE_STOCK_CRON_DAYS_BACK = 14;

export const SVBUM_FAKE_STOCK_KONK_NAME = "svbum";

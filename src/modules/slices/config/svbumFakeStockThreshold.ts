/**
 * Порог фейкового остатка svbum: stock строго больше THRESHOLD считается глюком.
 * Post-pass и historical util обнуляют такие точки и дни между парными спайками.
 */
export const SVBUM_FAKE_STOCK_THRESHOLD = 900_000;

/**
 * Сколько календарных дней справа от хвостового спайка нужно, чтобы обнулить его
 * без второго спайка (иначе ждём возможный сэндвич).
 */
export const SVBUM_FAKE_STOCK_TRAILING_GRACE_DAYS = 2;

/** Сколько дней до окна коррекции грузить для контекста спайков слева. */
export const SVBUM_FAKE_STOCK_LOOKBACK_DAYS = 90;

export const SVBUM_FAKE_STOCK_KONK_NAME = "svbum";

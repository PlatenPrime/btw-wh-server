/**
 * Холостой режим air: при `true` сервер не ходит в сеть Air.
 * Stock/live/срезы возвращают -1/-1. Group listing crawl бросает AirServerIdleError.
 * Refill товарных групп и компенсация срезов — на клиенте.
 *
 * Для возврата к нормальной работе — установить в `false`.
 */
export const AIR_IDLE_MODE = true;

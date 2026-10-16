import { createLogger } from "../../../logging/createLogger.js";
import { toSliceDate } from "../../../utils/sliceDate.js";
import { afterSkuSliceStockMutation } from "./materializeSkuSliceSalesUtil.js";

const log = createLogger({
  module: "sku-reporting",
  job: "schedule-sku-slice-sales",
});

export type ScheduleAfterSkuSliceStockMutationParams = {
  konkName: string;
  dayD: Date;
};

type MutationRunner = (
  params: ScheduleAfterSkuSliceStockMutationParams,
) => Promise<unknown>;

type Slot = {
  dirty: boolean;
  running: boolean;
  runPromise: Promise<void> | null;
};

const slots = new Map<string, Slot>();

let mutationRunner: MutationRunner = afterSkuSliceStockMutation;

function slotKey(konkName: string, dayD: Date): string {
  const day = toSliceDate(dayD).toISOString().slice(0, 10);
  return `${konkName.trim().toLowerCase()}|${day}`;
}

function parseSlotKey(key: string): ScheduleAfterSkuSliceStockMutationParams {
  const sep = key.indexOf("|");
  const konkName = key.slice(0, sep);
  const day = key.slice(sep + 1);
  return {
    konkName,
    dayD: new Date(`${day}T00:00:00.000Z`),
  };
}

async function pump(key: string): Promise<void> {
  const slot = slots.get(key);
  if (!slot || slot.running || !slot.dirty) return;

  slot.running = true;
  slot.dirty = false;
  const params = parseSlotKey(key);

  slot.runPromise = (async () => {
    try {
      await mutationRunner(params);
    } catch (err) {
      log.error(
        {
          err,
          konkName: params.konkName,
          dayD: params.dayD.toISOString().slice(0, 10),
        },
        "scheduled afterSkuSliceStockMutation failed",
      );
      // Не ставим dirty сами: иначе вечный retry при стабильной ошибке.
      // Trailing run сработает только если за время run снова вызвали schedule.
    } finally {
      slot.running = false;
      slot.runPromise = null;
      if (slot.dirty) {
        void pump(key);
      } else {
        slots.delete(key);
      }
    }
  })();

  await slot.runPromise;
}

/**
 * Неблокирующий хук после мутации stock/price: помечает (konk, day) dirty
 * и запускает один full rematerialize с trailing coalesce.
 * Для высокочастотных write-путей (air client PUT), где await full-day
 * rematerialize на каждый SKU недопустим.
 */
export function scheduleAfterSkuSliceStockMutation(
  params: ScheduleAfterSkuSliceStockMutationParams,
): void {
  const konkName = params.konkName.trim();
  if (!konkName) return;

  const key = slotKey(konkName, params.dayD);
  let slot = slots.get(key);
  if (!slot) {
    slot = { dirty: false, running: false, runPromise: null };
    slots.set(key, slot);
  }
  slot.dirty = true;
  void pump(key);
}

/** Дождаться завершения всех запланированных rematerialize (для тестов). */
export async function flushScheduledSkuSliceStockMutations(): Promise<void> {
  for (;;) {
    const pending = [...slots.values()]
      .map((s) => s.runPromise)
      .filter((p): p is Promise<void> => p !== null);
    if (pending.length === 0) {
      const dirtyIdle = [...slots.entries()].filter(
        ([, s]) => s.dirty && !s.running,
      );
      if (dirtyIdle.length === 0) return;
      for (const [key] of dirtyIdle) {
        void pump(key);
      }
      continue;
    }
    await Promise.all(pending);
  }
}

/** Сброс in-process очереди и runner (только тесты). */
export function resetScheduledSkuSliceStockMutationsForTests(): void {
  slots.clear();
  mutationRunner = afterSkuSliceStockMutation;
}

/** Подмена runner для unit-тестов coalesce. */
export function setScheduledSkuSliceStockMutationRunnerForTests(
  runner: MutationRunner,
): void {
  mutationRunner = runner;
}

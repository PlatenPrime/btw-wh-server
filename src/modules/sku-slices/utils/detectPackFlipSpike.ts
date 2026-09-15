import { isSkuSliceDataKeyFilled } from "./isSkuSliceDataKeyFilled.js";

export const PACK_FLIP_MIN_FACTOR = 2;
export const PACK_FLIP_VALUE_REL_TOL = 0.05;
export const PACK_FLIP_FACTOR_REL_TOL = 0.05;
export const PACK_FLIP_STOCK_REL_TOL = 0.1;

export type SlicePoint = {
  stock: number;
  price: number;
};

export type InversePackFlip = {
  kind: "inverse";
  factor: number;
  currStockScaledUp: boolean;
};

export type PriceOnlyPackFlip = {
  kind: "price-only";
  factor: number;
};

export type SeriesDay = {
  dateMs: number;
  point: SlicePoint | null;
};

export type PackFlipSeriesDecision = {
  kind: "inverse" | "price-only" | "ambiguous";
  index: number;
  neighborIndex: number;
  factor: number;
  from: SlicePoint;
  patched?: SlicePoint;
};

function relativeDiff(a: number, b: number): number {
  const denom = Math.max(Math.abs(a), Math.abs(b), 1e-9);
  return Math.abs(a - b) / denom;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isUsablePackFlipPoint(
  item: SlicePoint | null | undefined
): item is SlicePoint {
  if (!item) return false;
  if (!Number.isFinite(item.stock) || !Number.isFinite(item.price)) return false;
  return item.stock > 0 && item.price > 0;
}

export function readPackFlipPoint(item: unknown): SlicePoint | null {
  if (!isSkuSliceDataKeyFilled(item)) return null;
  const o = item as { stock: number; price: number };
  if (o.stock <= 0 || o.price <= 0) return null;
  return { stock: o.stock, price: o.price };
}

export function nearestIntegerFactor(ratio: number): number | null {
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  const r = ratio < 1 ? 1 / ratio : ratio;
  const n = Math.round(r);
  if (n < PACK_FLIP_MIN_FACTOR) return null;
  if (Math.abs(r - n) / n > PACK_FLIP_FACTOR_REL_TOL) return null;
  return n;
}

export function areSamePriceScale(a: SlicePoint, b: SlicePoint): boolean {
  if (!isUsablePackFlipPoint(a) || !isUsablePackFlipPoint(b)) return false;
  return nearestIntegerFactor(b.price / a.price) === null;
}

export function detectInversePackFlip(
  prev: SlicePoint,
  curr: SlicePoint
): InversePackFlip | null {
  if (!isUsablePackFlipPoint(prev) || !isUsablePackFlipPoint(curr)) return null;

  const prevValue = prev.stock * prev.price;
  const currValue = curr.stock * curr.price;
  if (relativeDiff(prevValue, currValue) > PACK_FLIP_VALUE_REL_TOL) return null;

  const stockUp = curr.stock > prev.stock;
  const priceDown = curr.price < prev.price;
  const stockDown = curr.stock < prev.stock;
  const priceUp = curr.price > prev.price;
  if (!((stockUp && priceDown) || (stockDown && priceUp))) return null;

  const stockFactor = nearestIntegerFactor(curr.stock / prev.stock);
  const priceFactor = nearestIntegerFactor(curr.price / prev.price);
  if (stockFactor === null || priceFactor === null) return null;
  if (stockFactor !== priceFactor) return null;

  return {
    kind: "inverse",
    factor: stockFactor,
    currStockScaledUp: stockUp,
  };
}

export function detectPriceOnlyPackFlip(
  prev: SlicePoint,
  curr: SlicePoint
): PriceOnlyPackFlip | null {
  if (!isUsablePackFlipPoint(prev) || !isUsablePackFlipPoint(curr)) return null;
  if (detectInversePackFlip(prev, curr)) return null;

  const stockRel = Math.abs(curr.stock - prev.stock) / prev.stock;
  if (stockRel > PACK_FLIP_STOCK_REL_TOL) return null;

  const factor = nearestIntegerFactor(curr.price / prev.price);
  if (factor === null) return null;

  return { kind: "price-only", factor };
}

export function rescaleToNeighborScale(
  neighbor: SlicePoint,
  anomaly: SlicePoint
): SlicePoint | null {
  const flip = detectInversePackFlip(neighbor, anomaly);
  if (!flip) return null;

  const patched = flip.currStockScaledUp
    ? {
        stock: Math.round(anomaly.stock / flip.factor),
        price: roundMoney(anomaly.price * flip.factor),
      }
    : {
        stock: Math.round(anomaly.stock * flip.factor),
        price: roundMoney(anomaly.price / flip.factor),
      };

  if (patched.stock <= 0 || patched.price <= 0) return null;
  return patched;
}

function pushInverseDecision(
  out: PackFlipSeriesDecision[],
  patchedIdx: Set<number>,
  index: number,
  neighborIndex: number,
  from: SlicePoint,
  neighbor: SlicePoint
): void {
  const patched = rescaleToNeighborScale(neighbor, from);
  const flip = detectInversePackFlip(neighbor, from);
  if (!patched || !flip) return;
  out.push({
    kind: "inverse",
    index,
    neighborIndex,
    factor: flip.factor,
    from,
    patched,
  });
  patchedIdx.add(index);
}

function collectRoundTripDecisions(
  series: SeriesDay[],
  out: PackFlipSeriesDecision[],
  patchedIdx: Set<number>,
  confirmedIdx: Set<number>
): void {
  for (let i = 1; i <= series.length - 2; i++) {
    const a = series[i - 1]?.point;
    const b = series[i]?.point;
    const c = series[i + 1]?.point;
    if (
      !isUsablePackFlipPoint(a) ||
      !isUsablePackFlipPoint(b) ||
      !isUsablePackFlipPoint(c)
    ) {
      continue;
    }

    const ab = detectInversePackFlip(a, b);
    const bc = detectInversePackFlip(b, c);
    const ac = detectInversePackFlip(a, c);

    if (ab && bc && !ac) {
      pushInverseDecision(out, patchedIdx, i, i - 1, b, a);
      confirmedIdx.add(i - 1);
      confirmedIdx.add(i + 1);
      continue;
    }

    if (ab && bc && ac) {
      out.push({
        kind: "ambiguous",
        index: i,
        neighborIndex: i - 1,
        factor: ab.factor,
        from: b,
      });
    }
  }
}

function collectEdgeSpikeDecisions(
  series: SeriesDay[],
  out: PackFlipSeriesDecision[],
  patchedIdx: Set<number>,
  confirmedIdx: Set<number>
): void {
  const n = series.length;
  if (n < 3) return;

  if (!patchedIdx.has(0)) {
    const a = series[0]?.point;
    const b = series[1]?.point;
    const c = series[2]?.point;
    if (
      isUsablePackFlipPoint(a) &&
      isUsablePackFlipPoint(b) &&
      isUsablePackFlipPoint(c)
    ) {
      const ab = detectInversePackFlip(a, b);
      const bc = detectInversePackFlip(b, c);
      if (ab && !bc && areSamePriceScale(b, c)) {
        pushInverseDecision(out, patchedIdx, 0, 1, a, b);
      }
    }
  }

  const last = n - 1;
  if (patchedIdx.has(last) || confirmedIdx.has(last)) return;

  const curr = series[last]?.point;
  const prev = series[last - 1]?.point;
  const d2 = series[last - 2]?.point;
  if (
    !isUsablePackFlipPoint(curr) ||
    !isUsablePackFlipPoint(prev) ||
    !isUsablePackFlipPoint(d2)
  ) {
    return;
  }

  const prevVsD2 = detectInversePackFlip(d2, prev);
  const currVsPrev = detectInversePackFlip(prev, curr);
  const currVsD2 = detectInversePackFlip(d2, curr);

  if (currVsPrev && prevVsD2 && currVsD2) {
    out.push({
      kind: "ambiguous",
      index: last,
      neighborIndex: last - 1,
      factor: currVsPrev.factor,
      from: curr,
    });
    return;
  }

  if (currVsPrev && !prevVsD2 && areSamePriceScale(d2, prev)) {
    pushInverseDecision(out, patchedIdx, last, last - 1, curr, prev);
  }
}

function collectPriceOnlyDecisions(
  series: SeriesDay[],
  out: PackFlipSeriesDecision[],
  patchedIdx: Set<number>
): void {
  for (let i = 1; i < series.length; i++) {
    if (patchedIdx.has(i) || patchedIdx.has(i - 1)) continue;
    const prev = series[i - 1]?.point;
    const curr = series[i]?.point;
    if (!isUsablePackFlipPoint(prev) || !isUsablePackFlipPoint(curr)) continue;
    if (detectInversePackFlip(prev, curr)) continue;
    const priceOnly = detectPriceOnlyPackFlip(prev, curr);
    if (!priceOnly) continue;
    out.push({
      kind: "price-only",
      index: i,
      neighborIndex: i - 1,
      factor: priceOnly.factor,
      from: curr,
    });
  }
}

/**
 * По календарной серии точек: round-trip A→B→A патчит B;
 * ведущий/хвостовой скачок патчит край, если соседняя пара на том же масштабе;
 * неоднозначные двойные инверсии — без патча; price-only только отчёт.
 */
export function decidePackFlipPatchesForSeries(
  series: SeriesDay[]
): PackFlipSeriesDecision[] {
  const out: PackFlipSeriesDecision[] = [];
  const patchedIdx = new Set<number>();
  const confirmedIdx = new Set<number>();
  collectRoundTripDecisions(series, out, patchedIdx, confirmedIdx);
  collectEdgeSpikeDecisions(series, out, patchedIdx, confirmedIdx);
  collectPriceOnlyDecisions(series, out, patchedIdx);
  return out;
}

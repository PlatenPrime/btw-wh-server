import type { Express, RequestHandler } from "express";

import analogSlicesRoute from "./modules/analog-slices/router.js";
import analogsRoute from "./modules/analogs/router.js";
import artChartReportsRoute from "./modules/art-chart-reports/router.js";
import artExcelReportsRoute from "./modules/art-excel-reports/router.js";
import artSalesReportsRoute from "./modules/art-sales-reports/router.js";
import artsRoute from "./modules/arts/router.js";
import asksRoute from "./modules/asks/router.js";
import authRoute from "./modules/auth/router.js";
import blocksRoute from "./modules/blocks/router.js";
import browserRoute from "./modules/browser/router.js";
import btradeSlicesRoute from "./modules/btrade-slices/router.js";
import constantsRoute from "./modules/constants/router.js";
import defsRoute from "./modules/defs/router.js";
import delsRoute from "./modules/dels/router.js";
import eventsRoute from "./modules/events/router.js";
import excelJobsRoute from "./modules/excel-jobs/router.js";
import graboSkusRoute from "./modules/grabo-skus/router.js";
import kasksRoute from "./modules/kasks/router.js";
import konksRoute from "./modules/konks/router.js";
import mediaRoute from "./modules/media/router.js";
import palletGroupsRoute from "./modules/pallet-groups/router.js";
import palletsRoute from "./modules/pallets/router.js";
import posesRoute from "./modules/poses/router.js";
import prodsRoute from "./modules/prods/router.js";
import rowsRoute from "./modules/rows/router.js";
import segsRoute from "./modules/segs/router.js";
import skuChartReportsRoute from "./modules/sku-chart-reports/router.js";
import skuExcelReportsRoute from "./modules/sku-excel-reports/router.js";
import skuSalesReportsRoute from "./modules/sku-sales-reports/router.js";
import skuSlicesRoute from "./modules/sku-slices/router.js";
import skugrsRoute from "./modules/skugrs/router.js";
import skusRoute from "./modules/skus/router.js";
import sliceCompensationRoute from "./modules/slice-compensation/router.js";
import variantsRoute from "./modules/variants/router.js";
import zonesRoute from "./modules/zones/router.js";

export const API_ROUTES: ReadonlyArray<readonly [string, RequestHandler]> = [
  ["/api/analog-slices", analogSlicesRoute],
  ["/api/analogs", analogsRoute],
  ["/api/variants", variantsRoute],
  ["/api/auth", authRoute],
  ["/api/arts", artsRoute],
  ["/api/art-sales-reports", artSalesReportsRoute],
  ["/api/art-chart-reports", artChartReportsRoute],
  ["/api/art-excel-reports", artExcelReportsRoute],
  ["/api/browser", browserRoute],
  ["/api/btrade-slices", btradeSlicesRoute],
  ["/api/asks", asksRoute],
  ["/api/kasks", kasksRoute],
  ["/api/media", mediaRoute],
  ["/api/dels", delsRoute],
  ["/api/constants", constantsRoute],
  ["/api/events", eventsRoute],
  ["/api/excel-jobs", excelJobsRoute],
  ["/api/konks", konksRoute],
  ["/api/prods", prodsRoute],
  ["/api/skus", skusRoute],
  ["/api/sku-slices", skuSlicesRoute],
  ["/api/sku-excel-reports", skuExcelReportsRoute],
  ["/api/sku-sales-reports", skuSalesReportsRoute],
  ["/api/sku-chart-reports", skuChartReportsRoute],
  ["/api/skugrs", skugrsRoute],
  ["/api/blocks", blocksRoute],
  ["/api/segs", segsRoute],
  ["/api/slice-compensation", sliceCompensationRoute],
  ["/api/grabo-skus", graboSkusRoute],
  ["/api/rows", rowsRoute],
  ["/api/pallets", palletsRoute],
  ["/api/pallet-groups", palletGroupsRoute],
  ["/api/poses", posesRoute],
  ["/api/defs", defsRoute],
  ["/api/zones", zonesRoute],
];

export function getApiRoutePrefixes(): string[] {
  return API_ROUTES.map(([path]) => path);
}

export function registerRoutes(app: Express): void {
  for (const [path, router] of API_ROUTES) {
    app.use(path, router);
  }
}

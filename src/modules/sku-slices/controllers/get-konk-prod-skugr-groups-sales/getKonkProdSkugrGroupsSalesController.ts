import type { Request, Response } from "express";
import { getKonkProdSkugrGroupsSalesSchema } from "./schemas/getKonkProdSkugrGroupsSalesSchema.js";
import { getKonkProdSkugrGroupsSalesUtil } from "./utils/getKonkProdSkugrGroupsSalesUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const v = q[key];
  return Array.isArray(v) ? (v[0] as string) : (v as string | undefined);
}

/**
 * @desc    Итоги продаж (шт., грн) по товарным группам Skugr с данными konkName/prodName за период
 * @route   GET /api/sku-slices/konk-prod/skugr-groups-sales?konk=&prod=&dateFrom=&dateTo=
 */
export const getKonkProdSkugrGroupsSalesController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const q = req.query;
  const parseResult = getKonkProdSkugrGroupsSalesSchema.safeParse({
    konk: firstQuery(q, "konk"),
    prod: firstQuery(q, "prod"),
    dateFrom: firstQuery(q, "dateFrom"),
    dateTo: firstQuery(q, "dateTo"),
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getKonkProdSkugrGroupsSalesUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "No skugr documents found for provided konk/prod",
    });
    return;
  }

  res.status(200).json({
    message: "Konk/prod skugr groups sales retrieved successfully",
    data: result.data,
  });
};

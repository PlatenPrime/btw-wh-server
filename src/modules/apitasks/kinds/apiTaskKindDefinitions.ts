import mongoose from "mongoose";
import { z } from "zod";
import { RoleType } from "../../../constants/roles.js";
import { runCompensatingSliceSchema } from "../../slice-compensation/controllers/run-compensating-slice/schemas/runCompensatingSliceSchema.js";
import { runSkugrSlicesTodaySchema } from "../../sku-slices/controllers/run-skugr-slices-today/schemas/runSkugrSlicesTodaySchema.js";
import { fixIncorrectSkuDataSchema } from "../../skus/controllers/fix-incorrect-sku-data/schemas/fixIncorrectSkuDataSchema.js";
import { deleteKonkInvalidSkusParamsSchema } from "../../skus/controllers/delete-konk-invalid-skus/schemas/deleteKonkInvalidSkusSchema.js";
import { deleteSkusNotInAnySkugrQuerySchema } from "../../skus/controllers/delete-skus-not-in-any-skugr/schemas/deleteSkusNotInAnySkugrQuerySchema.js";
import {
  isApiTaskKind,
  type ApiTaskKind,
} from "../constants/apiTaskConstants.js";

export const emptyApiTaskParamsSchema = z.object({}).strict();

export const fillSkugrsApiTaskParamsSchema = z
  .object({
    skugrId: z.string().min(1, "skugrId is required"),
    maxPages: z.coerce.number().int().min(1).max(200).optional(),
  })
  .strict();

export const delsArtikulsUpdateAllParamsSchema = z
  .object({
    delId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid del ID format",
    }),
  })
  .strict();

export type ApiTaskKindDefinition = {
  kind: ApiTaskKind;
  minRole: RoleType;
  schema: z.ZodTypeAny;
  oldPath: string;
  getResourceKey?: (params: Record<string, unknown>) => string | undefined;
};

export const API_TASK_KIND_DEFINITIONS: Record<
  ApiTaskKind,
  ApiTaskKindDefinition
> = {
  "sku-slices.skugr-run-today": {
    kind: "sku-slices.skugr-run-today",
    minRole: RoleType.ADMIN,
    schema: runSkugrSlicesTodaySchema,
    oldPath: "POST /api/sku-slices/skugr/:skugrId/run-today",
    getResourceKey: (params) =>
      typeof params.skugrId === "string" ? `skugr:${params.skugrId}` : undefined,
  },
  "slice-compensation.run": {
    kind: "slice-compensation.run",
    minRole: RoleType.ADMIN,
    schema: runCompensatingSliceSchema,
    oldPath: "POST /api/slice-compensation/run",
    getResourceKey: (params) =>
      typeof params.konkName === "string" ? `konk:${params.konkName}` : undefined,
  },
  "skugrs.fill-skus": {
    kind: "skugrs.fill-skus",
    minRole: RoleType.ADMIN,
    schema: fillSkugrsApiTaskParamsSchema,
    oldPath: "POST /api/skugrs/id/:id/fill-skus",
    getResourceKey: (params) =>
      typeof params.skugrId === "string" ? `skugr:${params.skugrId}` : undefined,
  },
  "grabo-skus.sync": {
    kind: "grabo-skus.sync",
    minRole: RoleType.ADMIN,
    schema: emptyApiTaskParamsSchema,
    oldPath: "POST /api/grabo-skus/sync",
    getResourceKey: () => "global:grabo-skus.sync",
  },
  "arts.btrade-stock-update-all": {
    kind: "arts.btrade-stock-update-all",
    minRole: RoleType.ADMIN,
    schema: emptyApiTaskParamsSchema,
    oldPath: "POST /api/arts/btrade-stock/update-all",
    getResourceKey: () => "global:arts.btrade-stock-update-all",
  },
  "dels.artikuls-update-all": {
    kind: "dels.artikuls-update-all",
    minRole: RoleType.ADMIN,
    schema: delsArtikulsUpdateAllParamsSchema,
    oldPath: "POST /api/dels/:id/artikuls/update-all",
    getResourceKey: (params) =>
      typeof params.delId === "string" ? `del:${params.delId}` : undefined,
  },
  "pallet-groups.recalculate-pallets-sectors": {
    kind: "pallet-groups.recalculate-pallets-sectors",
    minRole: RoleType.ADMIN,
    schema: emptyApiTaskParamsSchema,
    oldPath: "POST /api/pallet-groups/recalculate-pallets-sectors",
    getResourceKey: () => "global:pallet-groups.recalculate-pallets-sectors",
  },
  "blocks.recalculate-zones-sectors": {
    kind: "blocks.recalculate-zones-sectors",
    minRole: RoleType.ADMIN,
    schema: emptyApiTaskParamsSchema,
    oldPath: "POST /api/blocks/recalculate-zones-sectors",
    getResourceKey: () => "global:blocks.recalculate-zones-sectors",
  },
  "poses.populate-missing-data": {
    kind: "poses.populate-missing-data",
    minRole: RoleType.EDITOR,
    schema: emptyApiTaskParamsSchema,
    oldPath: "POST /api/poses/populate-missing-data",
    getResourceKey: () => "global:poses.populate-missing-data",
  },
  "skus.fix-incorrect-sku-data": {
    kind: "skus.fix-incorrect-sku-data",
    minRole: RoleType.ADMIN,
    schema: fixIncorrectSkuDataSchema,
    oldPath: "POST /api/skus/fix-incorrect-sku-data",
  },
  "skus.delete-konk-invalid": {
    kind: "skus.delete-konk-invalid",
    minRole: RoleType.PRIME,
    schema: deleteKonkInvalidSkusParamsSchema,
    oldPath: "DELETE /api/skus/konk/:konkName/invalid",
    getResourceKey: (params) =>
      typeof params.konkName === "string"
        ? `konk-invalid:${params.konkName}`
        : undefined,
  },
  "skus.delete-not-in-any-skugr": {
    kind: "skus.delete-not-in-any-skugr",
    minRole: RoleType.PRIME,
    schema: deleteSkusNotInAnySkugrQuerySchema,
    oldPath: "DELETE /api/skus/not-in-any-skugr",
    getResourceKey: () => "global:skus.delete-not-in-any-skugr",
  },
  "arts.delete-without-latest-marker": {
    kind: "arts.delete-without-latest-marker",
    minRole: RoleType.PRIME,
    schema: emptyApiTaskParamsSchema,
    oldPath: "DELETE /api/arts/without-latest-marker",
    getResourceKey: () => "global:arts.delete-without-latest-marker",
  },
};

export function getApiTaskKindDefinition(
  kind: string,
): ApiTaskKindDefinition | undefined {
  if (!isApiTaskKind(kind)) {
    return undefined;
  }
  return API_TASK_KIND_DEFINITIONS[kind];
}

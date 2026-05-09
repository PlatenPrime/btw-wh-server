import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkRoles } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createAnalogController,
  deleteAnalogByIdController,
  getAnalogByIdController,
  getAnalogStockDataController,
  getAnalogsByArtikulController,
  getAnalogsByKonkController,
  getAnalogsByProdController,
  getAnalogsController,
  updateAnalogByIdController,
} from "./controllers/index.js";

const router = Router();

router.get(
  "/id/:id/stock",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAnalogStockDataController)
);
router.get(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAnalogByIdController)
);
router.get(
  "/prod/:prodName",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAnalogsByProdController)
);
router.get(
  "/konk/:konkName",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAnalogsByKonkController)
);
router.get(
  "/artikul/:artikul",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAnalogsByArtikulController)
);
router.get(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(getAnalogsController)
);
router.post(
  "/",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(createAnalogController)
);
router.patch(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.ADMIN]),
  asyncHandler(updateAnalogByIdController)
);
router.delete(
  "/id/:id",
  checkAuth,
  checkRoles([RoleType.PRIME]),
  asyncHandler(deleteAnalogByIdController)
);

export default router;

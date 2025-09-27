import { Router } from "express";
import {
  calculatePogrebiDefsController,
  getCalculationStatusController,
  getLatestDefcalcs,
} from "./controllers/index.js";

const router = Router();

// Маршруты для расчетов дефицитов
router.post("/calculate", calculatePogrebiDefsController);
router.get("/latest", getLatestDefcalcs);
router.get("/calculation-status", getCalculationStatusController);

export default router;

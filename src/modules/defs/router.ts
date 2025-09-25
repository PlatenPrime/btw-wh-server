import { Router } from "express";
import {
  calculatePogrebiDefsController,
  getLatestDefcalcs,
} from "./controllers/index.js";

const router = Router();

// Маршруты для расчетов дефицитов
router.post("/calculate", calculatePogrebiDefsController);
router.get("/latest", getLatestDefcalcs);

export default router;

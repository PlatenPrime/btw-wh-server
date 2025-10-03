import { Router } from "express";
import { calculatePogrebiDefsController, getCalculationStatusController, getLatestDefs, } from "./controllers/index.js";
const router = Router();
// Маршруты для расчетов дефицитов
router.post("/calculate", calculatePogrebiDefsController);
router.get("/latest", getLatestDefs);
router.get("/calculation-status", getCalculationStatusController);
export default router;

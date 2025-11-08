import { Router } from "express";
import { RoleType } from "../../constants/roles.js";
import { checkAuth, checkOwnership, checkRoles, } from "../../middleware/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { completeAskById, createAskController, deleteAskById, getAskById, getAsksByDate, pullAskById, rejectAskById, updateAskActionsById, } from "./controllers/index.js";
import { Ask } from "./models/Ask.js";
const router = Router();
// Создать ask - доступно для всех авторизованных пользователей
router.post("/", checkAuth, checkRoles([RoleType.USER]), asyncHandler(createAskController));
// Получить asks по дате - доступно для всех авторизованных пользователей
router.get("/by-date", checkAuth, checkRoles([RoleType.USER]), asyncHandler(getAsksByDate));
// Получить ask по ID - доступно для всех авторизованных пользователей
router.get("/:id", checkAuth, checkRoles([RoleType.USER]), asyncHandler(getAskById));
// Зафиксировать снятие товара (pull) - доступно для ADMIN и PRIME
router.patch("/:id/pull", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(pullAskById));
// Завершить ask - доступно для ADMIN и PRIME
router.patch("/:id/complete", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(completeAskById));
// Отклонить ask - доступно для ADMIN и PRIME
router.patch("/:id/reject", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(rejectAskById));
// Обновить действия ask - доступно для ADMIN и PRIME
router.patch("/:id/actions", checkAuth, checkRoles([RoleType.ADMIN]), asyncHandler(updateAskActionsById));
// Удалить ask - доступно для ADMIN, PRIME и владельца ask
router.delete("/:id", checkAuth, checkOwnership(async (req) => {
    const ask = await Ask.findById(req.params.id);
    return ask?.asker.toString();
}), asyncHandler(deleteAskById));
export default router;

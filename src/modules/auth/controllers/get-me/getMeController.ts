import { Request, Response } from "express";
import { getMeSchema } from "./schemas/getMeSchema.js";
import { getMeUtil } from "./utils/getMeUtil.js";
import { getMeResponseUtil } from "./utils/getMeResponseUtil.js";

export const getMeController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Валидация входных данных
    const parseResult = getMeSchema.safeParse({ id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    // Получение пользователя
    const user = await getMeUtil(parseResult.data.id);

    if (!user) {
      res.status(404).json({ message: "Користувач не знайдений" });
      return;
    }

    // Формирование ответа
    const response = getMeResponseUtil({ user });
    res.status(200).json(response);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: "Немає доступу.", error });
    }
  }
};


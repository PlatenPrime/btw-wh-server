import { Request, Response } from "express";
import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import User from "../../auth/models/User.js";
import { Ask, type AskStatus, IAsk, validAskStatuses } from "../models/Ask.js";

interface UpdateAskRequest {
  solverId: string;
  action: string;
  status?: AskStatus;
}

export const updateAskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: UpdateAskRequest = req.body;

    // Проверяем обязательное наличие solverId
    if (!updateData.solverId) {
      return res.status(400).json({ message: "solverId is required" });
    }

    // Проверяем обязательное наличие action
    if (!updateData.action) {
      return res.status(400).json({ message: "action is required" });
    }

    // Проверяем существование ask
    const existingAsk = await Ask.findById(id);
    if (!existingAsk) {
      return res.status(404).json({ message: "Ask not found" });
    }

    // Проверяем существование пользователя-решателя
    const solver = await User.findById(updateData.solverId);
    if (!solver) {
      return res.status(404).json({ message: "Solver user not found" });
    }

    // Подготавливаем данные solver
    const solverData = {
      id: solver._id.toString(),
      fullname: solver.fullname,
      telegram: solver.telegram,
      photo: solver.photo,
    };

    // Проверяем правильность изменения статуса, если он передан
    if (updateData.status) {
      if (!validAskStatuses.includes(updateData.status)) {
        return res.status(400).json({
          message:
            "Invalid status. Must be one of: new, in_progress, completed, cancelled",
        });
      }

    }

    // Добавляем новое действие в конец массива actions
    const time = getCurrentFormattedDateTime();
    const solverName = solverData.fullname;
    const newAction = `${time} ${solverName}: ${updateData.action}`;
    const updatedActions = [...existingAsk.actions, newAction];

    // Подготавливаем данные для обновления
    const updateFields: Partial<IAsk> = {
      actions: updatedActions,
      solverData,
      solver: updateData.solverId as any,
    };

    // Добавляем status только если он передан
    if (updateData.status) {
      updateFields.status = updateData.status;
    }

    // Обновляем ask
    const updatedAsk = await Ask.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!updatedAsk) {
      return res.status(500).json({ message: "Failed to update ask" });
    }

    res.status(200).json(updatedAsk);
  } catch (error) {
    console.error("Error updating ask:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

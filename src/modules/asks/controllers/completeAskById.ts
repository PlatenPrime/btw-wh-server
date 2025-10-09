import { Request, Response } from "express";
import { Types } from "mongoose";
import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import { sendMessageToTGUser } from "../../../utils/telegram/sendMessageToTGUser.js";
import User from "../../auth/models/User.js";
import { Ask, IAsk } from "../models/Ask.js";

interface CompleteAskRequestData {
  solverId: Types.ObjectId;
}

export const completeAskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { solverId }: CompleteAskRequestData = req.body;

    if (!solverId) {
      return res.status(400).json({ message: "solverId is required" });
    }

    const existingAsk = await Ask.findById(id);
    if (!existingAsk) {
      return res.status(404).json({ message: "Ask not found" });
    }

    const solver = await User.findById(solverId);
    if (!solver) {
      return res.status(404).json({ message: "Solver user not found" });
    }

    const solverData = {
      _id: solver._id,
      fullname: solver.fullname,
      telegram: solver.telegram,
      photo: solver.photo,
    };

    const time = getCurrentFormattedDateTime();
    const solverName = solverData.fullname;
    const newAction = `${time} ${solverName}: ВИКОНАВ запит`;
    const updatedActions = [...existingAsk.actions, newAction];

    const updateFields: Partial<IAsk> = {
      actions: updatedActions,
      solverData,
      solver: solverId,
      status: "completed",
    };
    const updatedAsk = await Ask.findByIdAndUpdate(id, updateFields, {
      new: true,
      runValidators: true,
    });
    if (!updatedAsk) {
      return res.status(500).json({ message: "Failed to update ask" });
    }

    // Сначала отправляем ответ клиенту
    res.status(200).json(updatedAsk);

    // Отправка уведомления создателю запроса о завершении
    if (existingAsk.askerData?.telegram) {
      try {
        const telegramMessage = `✅ Ваш запит виконано!

📦 ${existingAsk.artikul}
📝 ${existingAsk.nameukr || "—"}
🔢 ${existingAsk.quant ?? "—"}
👤 Виконавець: ${solverName}`;

        await sendMessageToTGUser(
          telegramMessage,
          existingAsk.askerData.telegram
        );
      } catch (telegramError) {
        // Логируем ошибку, но это уже не повлияет на ответ клиенту
        console.error(
          "Failed to send Telegram notification to asker:",
          telegramError
        );
      }
    }
  } catch (error) {
    console.error("Error completing ask:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

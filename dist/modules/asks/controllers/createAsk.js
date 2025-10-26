import { RoleType } from "../../../constants/roles.js";
import { getCurrentFormattedDateTime } from "../../../utils/getCurrentFormattedDateTime.js";
import { sendMessageToBTWChat } from "../../../utils/telegram/sendMessageToBTWChat.js";
import User from "../../auth/models/User.js";
import { Ask } from "../models/Ask.js";
export const createAsk = async (req, res) => {
    try {
        const { artikul, nameukr, quant, com, askerId } = req.body;
        const asker = await User.findById(askerId);
        if (!asker) {
            return res.status(404).json({ message: "User not found" });
        }
        const time = getCurrentFormattedDateTime();
        const actions = [
            `${time} ${asker?.fullname ?? ""}: необхідно ${nameukr}
      ${quant !== undefined && ", кількість: "}${quant}
      ${com && ", коментарій: "}${com}`,
        ];
        const ask = new Ask({
            artikul,
            nameukr,
            quant,
            com,
            asker: askerId,
            askerData: {
                _id: asker._id,
                fullname: asker.fullname,
                telegram: asker.telegram,
                photo: asker.photo,
            },
            actions,
            status: "new",
        });
        await ask.save();
        // Сначала отправляем ответ клиенту
        res.status(201).json(ask);
        // Отправка уведомления в Telegram чат дефицитов (асинхронно, не блокируя ответ)
        // Не отправляем сообщения для пользователей с ролью PRIME или в тестовом окружении
        if (asker.role !== RoleType.PRIME && process.env.NODE_ENV !== "test") {
            try {
                const telegramMessage = `🆕 Новий запит

👤 ${asker.fullname}
📦 ${artikul}
📝 ${nameukr || "—"}${quant !== undefined && quant !== null ? `\n\n🔢 ${quant}` : ""}${com ? `\n💬 ${com}` : ""}`;
                await sendMessageToBTWChat(telegramMessage);
            }
            catch (telegramError) {
                // Логируем ошибку, но это уже не повлияет на ответ клиенту
                console.error("Failed to send Telegram notification:", telegramError);
            }
        }
    }
    catch (error) {
        console.error("Error creating ask:", error);
        res.status(500).json({ message: "Server error", error });
    }
};

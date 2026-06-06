const getRequiredEnv = (name) => {
    const value = process.env[name]?.trim();
    if (!value) {
        console.error(`Missing required environment variable: ${name}`);
        throw new Error(`Telegram configuration error: ${name} is not set`);
    }
    return value;
};
export const getBtwToken = () => getRequiredEnv("BTW_TOKEN");
export const getBtwChatId = () => getRequiredEnv("BTW_CHAT_ID");
/** Чат кассы для уведомлений о kask */
export const getKasaChatId = () => getRequiredEnv("KASA_CHAT_ID");
export const getBtwDefsChatId = () => getRequiredEnv("BTW_DEFS_CHAT_ID");
export const getBtwPlatenId = () => getRequiredEnv("BTW_PLATEN_ID");

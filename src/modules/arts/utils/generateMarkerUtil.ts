/**
 * Генерирует маркер в формате YYYYMMDD на основе текущей даты
 * Использует часовой пояс Europe/Kyiv
 * @returns Маркер в формате YYYYMMDD (например, "20251123" для 23 ноября 2025)
 */
export const generateMarkerUtil = (): string => {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Convert to Kyiv timezone (Europe/Kyiv)
  const kyivTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Kyiv" })
  );

  const year = kyivTime.getFullYear();
  const month = pad(kyivTime.getMonth() + 1);
  const day = pad(kyivTime.getDate());

  return `${year}${month}${day}`;
};

export function getCurrentFormattedDateTime() {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Convert to Kyiv timezone (Europe/Kyiv)
  const kyivTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Kyiv" })
  );

  const formattedDateTime = `${pad(kyivTime.getDate())}.${pad(
    kyivTime.getMonth() + 1
  )}.${kyivTime.getFullYear()} ${pad(kyivTime.getHours())}:${pad(
    kyivTime.getMinutes()
  )}`;

  return formattedDateTime;
}

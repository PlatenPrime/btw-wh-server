export function getCurrentFormattedDateTime() {
    const now = new Date();
    const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
    const formattedDateTime = `${pad(now.getDate())}.${pad(now.getMonth() + 1)}.${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return formattedDateTime;
}

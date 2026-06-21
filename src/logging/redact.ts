/** Пути pino-redact для чувствительных полей в логах. */
export const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "token",
  "jwt",
  "*.password",
  "*.token",
  "headers.authorization",
  "headers.cookie",
] as const;

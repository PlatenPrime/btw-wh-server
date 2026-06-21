/**
 * Расширение стандартного Express Request для хранения данных пользователя
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Correlation id из pino-http (x-request-id).
       */
      id?: string;
      /**
       * Данные пользователя из JWT токена
       */
      user?: {
        /** ID пользователя */
        id: string;
        /** Роль пользователя */
        role: string;
      };
    }
  }
}

export {};

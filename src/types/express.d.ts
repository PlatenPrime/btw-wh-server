/**
 * Расширение стандартного Express Request для хранения данных пользователя
 */
declare global {
  namespace Express {
    interface Request {
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

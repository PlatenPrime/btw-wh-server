export interface TelegramMessageResponse {
    ok: boolean;
    result: {
      message_id: number;
      from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username: string;
      };
      chat: {
        id: number;
        title?: string;
        type: string;
      };
      date: number;
      text: string;
    };
  }
  
  export interface TelegramDocumentResponse {
    ok: boolean;
    result: {
      message_id: number;
      from: {
        id: number;
        is_bot: boolean;
        first_name: string;
        username: string;
      };
      chat: {
        id: number;
        type: string;
      };
      date: number;
      document: {
        file_name: string;
        mime_type: string;
        file_id: string;
        file_unique_id: string;
        file_size: number;
      };
    };
  }
  
  export interface TelegramError {
    ok: false;
    error_code: number;
    description: string;
  }
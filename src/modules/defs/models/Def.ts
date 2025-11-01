import mongoose, { Document, Model, Schema, Types } from "mongoose";

/**
 * Интерфейс для информации о существующей заявке
 */
export interface IExistingAsk {
  _id: string;
  status: string;
  createdAt: Date;
  askerName: string;
  askerId: string;
}

/**
 * Интерфейс для данных о дефиците по артикулу с информацией о заявке
 */
export interface IDeficitItemWithAsk extends IDeficitItem {
  existingAsk: IExistingAsk | null;
}

/**
 * Типы статусов дефицита
 */
export type DeficitStatus = "limited" | "critical";

/**
 * Интерфейс для данных о дефиците по артикулу
 */
export interface IDeficitItem {
  nameukr: string;
  quant: number; // общее количество посчитанного товара на складе
  sharikQuant: number; // количество товара на сайте
  difQuant: number; // разница между sharikQuant и quant
  defLimit: number; // сумма quant + artLimit
  status: DeficitStatus; // статус дефицита: 'limited' или 'critical'
}

/**
 * Интерфейс для результата расчета дефицитов
 */
export interface IDeficitCalculationResult {
  [artikul: string]: IDeficitItem;
}

/**
 * Интерфейс для результата расчета дефицитов с информацией о заявках
 */
export interface IDeficitCalculationResultWithAsks {
  [artikul: string]: IDeficitItemWithAsk;
}

/**
 * Интерфейс для документа расчета дефицитов
 */
export interface IDef extends Document {
  _id: Types.ObjectId;
  result: IDeficitCalculationResult;
  total: number;
  totalCriticalDefs: number;
  totalLimitDefs: number;
  createdAt: Date;
  updatedAt: Date;
}

// Схема для результата расчета дефицитов
const deficitCalculationResultSchema = new Schema<IDeficitCalculationResult>(
  {},
  {
    _id: false,
    strict: false, // Позволяет сохранять динамические ключи
  }
);

// Основная схема для расчета дефицитов
const defSchema = new Schema<IDef>(
  {
    result: {
      type: deficitCalculationResultSchema,
      required: true,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    totalCriticalDefs: {
      type: Number,
      required: true,
      default: 0,
    },
    totalLimitDefs: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Def Mongoose model
 * @see IDef
 */
export const Def: Model<IDef> = mongoose.model<IDef>(
  "Def",
  defSchema,
  "defs" // Указываем имя коллекции как "defs"
);

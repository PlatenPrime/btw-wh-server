import mongoose, { Document, Model, Schema } from "mongoose";

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
 * Интерфейс для данных о дефиците по артикулу
 */
export interface IDeficitItem {
  nameukr: string;
  quant: number; // общее количество посчитанного товара на складе
  sharikQuant: number; // количество товара на сайте
  difQuant: number; // разница между sharikQuant и quant
  defLimit: number; // сумма quant + artLimit
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
export interface IDefcalc extends Document {
  result: IDeficitCalculationResult;
  total: number;
  totalCriticalDefs: number;
  totalLimitDefs: number;
  createdAt: Date;
  updatedAt: Date;
}

// Схема для элемента дефицита
const deficitItemSchema = new Schema<IDeficitItem>(
  {
    nameukr: { type: String, required: true },
    quant: { type: Number, required: true }, // общее количество посчитанного товара на складе
    sharikQuant: { type: Number, required: true }, // количество товара на сайте
    difQuant: { type: Number, required: true }, // разница между sharikQuant и quant
    defLimit: { type: Number, required: true }, // сумма quant + artLimit
  },
  { _id: false }
);

// Схема для результата расчета дефицитов
const deficitCalculationResultSchema = new Schema<IDeficitCalculationResult>(
  {},
  {
    _id: false,
    strict: false, // Позволяет сохранять динамические ключи
  }
);

// Основная схема для расчета дефицитов
const defcalcSchema = new Schema<IDefcalc>(
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
 * Defcalc Mongoose model
 * @see IDefcalc
 */
export const Defcalc: Model<IDefcalc> = mongoose.model<IDefcalc>(
  "Defcalc",
  defcalcSchema
);

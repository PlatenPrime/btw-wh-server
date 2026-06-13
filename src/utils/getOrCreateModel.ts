import mongoose, { Model, Schema } from "mongoose";

/**
 * Registers a Mongoose model once per process.
 * Safe for Vitest module isolation and hot reload.
 */
export function getOrCreateModel<T>(
  name: string,
  schema: Schema<T>,
  collection?: string,
): Model<T> {
  if (mongoose.models[name]) {
    return mongoose.models[name] as Model<T>;
  }

  return collection !== undefined
    ? mongoose.model<T>(name, schema, collection)
    : mongoose.model<T>(name, schema);
}

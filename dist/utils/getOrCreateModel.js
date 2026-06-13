import mongoose from "mongoose";
/**
 * Registers a Mongoose model once per process.
 * Safe for Vitest module isolation and hot reload.
 */
export function getOrCreateModel(name, schema, collection) {
    if (mongoose.models[name]) {
        return mongoose.models[name];
    }
    return collection !== undefined
        ? mongoose.model(name, schema, collection)
        : mongoose.model(name, schema);
}

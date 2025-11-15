export const isPositiveNumber = (value: unknown): value is number =>
    typeof value === "number" && !Number.isNaN(value) && value > 0;
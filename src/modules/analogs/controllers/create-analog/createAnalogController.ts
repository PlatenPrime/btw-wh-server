import { Request, Response } from "express";
import { createAnalogSchema } from "./schemas/createAnalogSchema.js";
import { createAnalogUtil } from "./utils/createAnalogUtil.js";

function isDuplicateUrlError(err: unknown): err is { code: number; keyPattern?: { url?: number } } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code: number }).code === 11000 &&
    (err as { keyPattern?: { url?: number } }).keyPattern?.url !== undefined
  );
}

/**
 * @desc    Создать аналог (аналог артикула у конкурента)
 * @route   POST /api/analogs
 */
export const createAnalogController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = createAnalogSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const analog = await createAnalogUtil(parseResult.data);

    res.status(201).json({
      message: "Analog created successfully",
      data: analog,
    });
  } catch (error) {
    console.error("Error creating analog:", error);
    if (res.headersSent) return;
    if (isDuplicateUrlError(error)) {
      res.status(409).json({ message: "Analog with this url already exists" });
      return;
    }
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
};

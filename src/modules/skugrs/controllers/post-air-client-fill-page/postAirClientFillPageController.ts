import { Request, Response } from "express";
import { postAirClientFillPageSchema } from "./schemas/postAirClientFillPageSchema.js";
import { postAirClientFillPageUtil } from "./utils/postAirClientFillPageUtil.js";

/**
 * @desc    Refill одной страницы Air-группы из HTML first-party листинга
 * @route   POST /api/skugrs/client/air/id/:id/fill-page
 */
export const postAirClientFillPageController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = postAirClientFillPageSchema.safeParse({
    id: req.params.id,
    sourceUrl: req.body?.sourceUrl,
    pageUrl: req.body?.pageUrl,
    html: req.body?.html,
  });
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await postAirClientFillPageUtil(parseResult.data);

  if (!result.ok) {
    if (result.code === "SKUGR_NOT_FOUND") {
      res.status(404).json({ message: result.message });
      return;
    }
    if (result.code === "PARSE_FAILED") {
      res.status(422).json({ message: result.message, code: result.code });
      return;
    }
    res.status(400).json({ message: result.message, code: result.code });
    return;
  }

  res.status(200).json({
    message: "Air client skugr page filled successfully",
    data: {
      stats: result.stats,
      nextPageUrl: result.nextPageUrl,
      productsOnPage: result.productsOnPage,
    },
  });
};

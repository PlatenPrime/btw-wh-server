import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Del } from "../../models/Del.js";
import { Prod } from "../../../prods/models/Prod.js";
import { updateDelTitleByIdController } from "../update-del-title-by-id/updateDelTitleByIdController.js";

describe("updateDelTitleByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Del.deleteMany({});
    await Prod.deleteMany({});
    await Prod.create({
      name: "acme",
      title: "Acme",
      imageUrl: "https://example.com/acme.png",
    });
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 when validation fails", async () => {
    const req = {
      params: { id: "invalid-id" },
      body: { title: "New", prodName: "acme" },
    } as unknown as Request;
    await updateDelTitleByIdController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404 when del not found", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { title: "New", prodName: "acme" },
    } as unknown as Request;
    await updateDelTitleByIdController(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Del not found");
  });

  it("400 when prodName does not exist", async () => {
    const del = await Del.create({
      title: "Old",
      prodName: "acme",
      artikuls: {},
    });
    const req = {
      params: { id: del._id.toString() },
      body: { title: "New", prodName: "nonexistent" },
    } as unknown as Request;
    await updateDelTitleByIdController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe(
      "Производитель с указанным name не найден",
    );
  });

  it("200 updates del title", async () => {
    const del = await Del.create({
      title: "Old title",
      prodName: "acme",
      artikuls: {},
    });
    const req = {
      params: { id: del._id.toString() },
      body: { title: "New title", prodName: "acme" },
    } as unknown as Request;
    await updateDelTitleByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Del title updated successfully");
    expect((responseJson.data as { title: string }).title).toBe("New title");
  });
});

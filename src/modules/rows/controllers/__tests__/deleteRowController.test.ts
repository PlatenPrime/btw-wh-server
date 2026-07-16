import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../test/setup.js";
import { Event } from "../../../events/models/Event.js";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { Pos } from "../../../poses/models/Pos.js";
import { Row } from "../../models/Row.js";
import { deleteRow } from "../delete-row/deleteRow.js";

describe("deleteRowController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("200: удаляет ряд и возвращает сообщение", async () => {
    const row = await Row.create({ title: "To Delete Controller" });
    const req = { params: { id: row._id.toString() } } as unknown as Request;

    await deleteRow(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Row and related pallets and positions deleted");

    const deleted = await Row.findById(row._id);
    expect(deleted).toBeNull();
  });

  it("200: создаёт audit event, если есть req.user", async () => {
    const row = await Row.create({ title: "To Delete Event" });
    const user = await createTestUser({
      username: `delete-row-event-${Date.now()}`,
    });
    const req = {
      user: { id: user._id.toString(), role: "PRIME" },
      params: { id: row._id.toString() },
    } as unknown as Request;

    await deleteRow(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "rows" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("To Delete Event");
  });

  it("404: когда ряд не найден", async () => {
    const req = { params: { id: "000000000000000000000000" } } as unknown as Request;

    await deleteRow(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Row not found");
  });

  it("400: ошибка валидации при невалидном ID", async () => {
    const req = { params: { id: "invalid-id" } } as unknown as Request;

    await deleteRow(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("200: каскадно удаляет связанные паллеты и позиции", async () => {
    const row = await Row.create({ title: "Cascade Test" });
    const pallet = await Pallet.create({
      title: "Pallet For Cascade",
      row: { _id: row._id, title: row.title },
      rowData: { _id: row._id, title: row.title },
      poses: [],
    });
    const pos = await Pos.create({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
      palletData: { _id: pallet._id, title: pallet.title },
      rowData: { _id: row._id, title: row.title },
      palletTitle: pallet.title,
      rowTitle: row.title,
      artikul: "ART-CASCADE",
      quant: 10,
      boxes: 2,
    });

    const req = { params: { id: row._id.toString() } } as unknown as Request;
    await deleteRow(req, res);

    expect(responseStatus.code).toBe(200);
    
    const deletedPallet = await Pallet.findById(pallet._id);
    const deletedPos = await Pos.findById(pos._id);
    expect(deletedPallet).toBeNull();
    expect(deletedPos).toBeNull();
  });
});


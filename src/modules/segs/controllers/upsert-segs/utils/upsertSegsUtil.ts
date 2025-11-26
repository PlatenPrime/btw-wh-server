import mongoose from "mongoose";
import { ClientSession } from "mongoose";
import { Block } from "../../../../blocks/models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { ISeg, Seg } from "../../../models/Seg.js";
import { UpsertSegsInput } from "../schemas/upsertSegsSchema.js";

const SECTOR_MULTIPLIER = 1000;

type UpsertSegsUtilInput = {
  segs: UpsertSegsInput;
  session: ClientSession;
};

type NormalizedSeg = {
  segId: mongoose.Types.ObjectId;
  blockId: mongoose.Types.ObjectId;
  order: number;
  zoneIds: mongoose.Types.ObjectId[];
};

const ensureUniqueZones = (segments: NormalizedSeg[]) => {
  const usageMap = new Map<string, string>();

  for (const seg of segments) {
    for (const zoneId of seg.zoneIds) {
      const zoneKey = zoneId.toString();
      const existingSegId = usageMap.get(zoneKey);
      if (existingSegId && existingSegId !== seg.segId.toString()) {
        throw new Error(
          `Zone ${zoneKey} is referenced by multiple segments in payload`
        );
      }
      usageMap.set(zoneKey, seg.segId.toString());
    }
  }
};

export const upsertSegsUtil = async ({
  segs,
  session,
}: UpsertSegsUtilInput): Promise<{
  processedSegs: ISeg[];
}> => {
  const normalizedSegs: NormalizedSeg[] = segs.map((seg) => {
    const segId = seg._id
      ? new mongoose.Types.ObjectId(seg._id)
      : new mongoose.Types.ObjectId();
    const blockId = new mongoose.Types.ObjectId(seg.blockId);
    const uniqueZones = Array.from(new Set(seg.zones));

    if (uniqueZones.length !== seg.zones.length) {
      throw new Error(
        `Segment ${segId.toString()} contains duplicate zone references`
      );
    }

    return {
      segId,
      blockId,
      order: seg.order,
      zoneIds: uniqueZones.map((zoneId) => new mongoose.Types.ObjectId(zoneId)),
    };
  });

  ensureUniqueZones(normalizedSegs);

  const segIdSet = new Set<string>();
  normalizedSegs.forEach((seg) => {
    const segKey = seg.segId.toString();
    if (segIdSet.has(segKey)) {
      throw new Error(`Duplicate segment _id in payload: ${segKey}`);
    }
    segIdSet.add(segKey);
  });

  const blockIds = Array.from(
    new Set(normalizedSegs.map((seg) => seg.blockId.toString()))
  ).map((id) => new mongoose.Types.ObjectId(id));

  const blocks = await Block.find({
    _id: { $in: blockIds },
  })
    .session(session)
    .exec();

  if (blocks.length !== blockIds.length) {
    throw new Error("One or more blocks not found");
  }

  const blockMap = new Map<string, (typeof blocks)[number]>();
  blocks.forEach((block) => blockMap.set(block._id.toString(), block));

  const allZoneIds = Array.from(
    new Set(
      normalizedSegs.flatMap((seg) => seg.zoneIds.map((zoneId) => zoneId.toString()))
    )
  ).map((id) => new mongoose.Types.ObjectId(id));

  const existingZones = await Zone.find({
    _id: { $in: allZoneIds },
  })
    .session(session)
    .exec();

  if (existingZones.length !== allZoneIds.length) {
    throw new Error("One or more zones not found");
  }

  const processedSegs: ISeg[] = [];

  for (const segInput of normalizedSegs) {
    const block = blockMap.get(segInput.blockId.toString());
    if (!block) {
      throw new Error("Block not found for segment");
    }

    const sector = block.order * SECTOR_MULTIPLIER + segInput.order;
    const segIdString = segInput.segId.toString();

    const existingSeg = await Seg.findById(segInput.segId).session(session).exec();

    if (existingSeg && existingSeg.block.toString() !== segInput.blockId.toString()) {
      throw new Error(
        `Segment ${segIdString} cannot change block reference`
      );
    }

    const zonesToRemove =
      existingSeg?.zones.filter(
        (zoneId) =>
          !segInput.zoneIds.some((inputZoneId) =>
            inputZoneId.equals(zoneId as mongoose.Types.ObjectId)
          )
      ) ?? [];

    if (zonesToRemove.length > 0) {
      await Zone.updateMany(
        { _id: { $in: zonesToRemove } },
        {
          $unset: { seg: "" },
          $set: { sector: 0 },
        },
        { session }
      );
    }

    const zonesToAdd = existingSeg
      ? segInput.zoneIds.filter(
          (zoneId) =>
            !existingSeg.zones.some((existingZoneId) =>
              zoneId.equals(existingZoneId as mongoose.Types.ObjectId)
            )
        )
      : segInput.zoneIds;

    if (zonesToAdd.length > 0) {
      const conflictingZones = await Zone.find({
        _id: { $in: zonesToAdd },
        "seg.id": { $exists: true, $ne: segInput.segId },
      })
        .session(session)
        .exec();

      if (conflictingZones.length > 0) {
        throw new Error(
          `Zones already belong to other segments: ${conflictingZones
            .map((zone) => zone._id.toString())
            .join(", ")}`
        );
      }
    }

    const zoneIdsForUpdate = segInput.zoneIds;
    if (zoneIdsForUpdate.length > 0) {
      await Zone.updateMany(
        { _id: { $in: zoneIdsForUpdate } },
        {
          $set: {
            "seg.id": segInput.segId,
            sector,
          },
        },
        { session }
      );
    }

    const payload = {
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: segInput.order,
      sector,
      zones: segInput.zoneIds,
    };

    let segDoc: ISeg | null = null;

    if (existingSeg) {
      segDoc = await Seg.findByIdAndUpdate(segInput.segId, payload, {
        new: true,
        session,
      }).exec();
    } else {
      const [createdSeg] = await Seg.create([{ _id: segInput.segId, ...payload }], {
        session,
      });
      segDoc = createdSeg;
    }

    await Block.updateOne(
      { _id: block._id },
      { $addToSet: { segs: segInput.segId } },
      { session }
    );

    if (!segDoc) {
      throw new Error("Failed to persist segment");
    }

    processedSegs.push(segDoc);
  }

  return { processedSegs };
};



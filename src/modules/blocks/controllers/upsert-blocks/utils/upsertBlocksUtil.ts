import mongoose from "mongoose";
import { Block, IBlock } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
import { UpsertBlocksInput } from "../schemas/upsertBlocksSchema.js";

type UpsertBlocksUtilInput = {
  blocks: UpsertBlocksInput;
};

type NormalizedBlock = {
  _id: mongoose.Types.ObjectId;
  title: string;
  order: number;
  segs?: mongoose.Types.ObjectId[];
};

const ensureUniqueEntries = (normalizedBlocks: NormalizedBlock[]) => {
  const idSet = new Set<string>();
  const titleSet = new Set<string>();

  normalizedBlocks.forEach((block) => {
    const idKey = block._id.toString();
    if (idSet.has(idKey)) {
      throw new Error(`Duplicate block _id in payload: ${idKey}`);
    }
    idSet.add(idKey);

    const titleKey = block.title.toLowerCase();
    if (titleSet.has(titleKey)) {
      throw new Error(`Duplicate block title in payload: ${block.title}`);
    }
    titleSet.add(titleKey);
  });
};

const validateSegmentsOwnership = async (
  blocks: NormalizedBlock[]
): Promise<void> => {
  for (const block of blocks) {
    if (!block.segs || block.segs.length === 0) {
      continue;
    }

    const segDocs = await Seg.find({
      _id: { $in: block.segs },
    })
      .select("_id block")
      .lean()
      .exec();

    if (segDocs.length !== block.segs.length) {
      throw new Error(
        `One or more segments do not exist for block ${block.title}`
      );
    }

    const invalidSegs = segDocs.filter(
      (seg) => seg.block.toString() !== block._id.toString()
    );

    if (invalidSegs.length > 0) {
      throw new Error(
        `Segments ${invalidSegs
          .map((seg) => seg._id.toString())
          .join(", ")} do not belong to block ${block.title}`
      );
    }
  }
};

export const upsertBlocksUtil = async ({
  blocks,
}: UpsertBlocksUtilInput): Promise<{
  bulkResult: mongoose.mongo.BulkWriteResult;
  updatedBlocks: IBlock[];
}> => {
  const normalizedBlocks: NormalizedBlock[] = blocks.map((block) => {
    const blockId = block._id
      ? new mongoose.Types.ObjectId(block._id)
      : new mongoose.Types.ObjectId();

    let segIds: mongoose.Types.ObjectId[] | undefined;
    if (block.segs) {
      const uniqueSegs = Array.from(new Set(block.segs));
      segIds = uniqueSegs.map((segId) => new mongoose.Types.ObjectId(segId));
    }

    return {
      _id: blockId,
      title: block.title,
      order: block.order,
      segs: segIds,
    };
  });

  ensureUniqueEntries(normalizedBlocks);
  await validateSegmentsOwnership(normalizedBlocks);

  const operations = normalizedBlocks.map((block) => {
    const updatePayload: Record<string, any> = {
      $set: {
        title: block.title,
        order: block.order,
      },
      $setOnInsert: {
        segs: block.segs ?? [],
      },
    };

    if (block.segs !== undefined) {
      updatePayload.$set.segs = block.segs;
    }

    return {
      updateOne: {
        filter: { _id: block._id },
        update: updatePayload,
        upsert: true,
      },
    };
  });

  const bulkResult = await Block.bulkWrite(operations, { ordered: false });

  await Promise.all(
    normalizedBlocks.map((block) =>
      Seg.updateMany(
        { block: block._id },
        { $set: { "blockData.title": block.title } }
      ).exec()
    )
  );

  const updatedBlocks = await Block.find({
    _id: { $in: normalizedBlocks.map((block) => block._id) },
  })
    .sort({ order: 1 })
    .exec();

  return {
    bulkResult,
    updatedBlocks,
  };
};



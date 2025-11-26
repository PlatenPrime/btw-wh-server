# Bulk Upsert Cheatsheet (Blocks & Segs)

Single source of truth for the new mass-update controllers that sync the warehouse structure in one round-trip.

## `/api/blocks/upsert`

| Item | Notes |
| --- | --- |
| Method | `POST` |
| Auth | Bearer + ADMIN |
| Body | `Array<{ _id?: string; title: string; order: number; segs?: string[] }>` |
| Matching | `_id` (generated when missing) |
| Constraints | titles unique (case-insensitive) within payload, `order >= 1`, `segs` must already belong to the block |
| Response | `{ bulkResult, updatedBlocks }` |

Usage:

```ts
await fetch("/api/blocks/upsert", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(
    blocks.map((block) => ({
      _id: block._id ?? undefined,
      title: block.title,
      order: block.order,
      segs: block.segs?.map((seg) => seg._id),
    }))
  ),
});
```

UI tips:
- Keep client state as the source of truth (e.g., Zustand/React Query store). After optimistic updates, call this endpoint to persist.
- Only include `segs` when you need to hard-sync the array—omit otherwise to reuse the current DB value.
- Trigger `/api/blocks/recalculate-zones-sectors` only after all block/seg mutations settle.

## `/api/segs/upsert`

| Item | Notes |
| --- | --- |
| Method | `POST` |
| Auth | Bearer + ADMIN |
| Body | `Array<{ _id?: string; blockId: string; order: number; zones: string[] }>` |
| Matching | `_id` |
| Constraints | `zones` unique across payload, blocks must exist, zones cannot belong to foreign segs, no block reassignment |
| Response | `{ processedSegs }` |

Usage:

```ts
await fetch("/api/segs/upsert", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify(
    segs.map((seg) => ({
      _id: seg._id,
      blockId: seg.blockId,
      order: seg.order,
      zones: seg.zoneIds,
    }))
  ),
});
```

UI tips:
- Validate duplicates client-side and surface friendly errors before hitting the API.
- Call this endpoint immediately after drag-and-drop reorderings to keep sectors aligned; the server recalculates sectors per block automatically.
- Removed zones are reset (`seg` unset, `sector = 0`)—refresh dependent caches (`["zones"]`, `["segs"]`, `["blocks"]`).
- Combine with `/api/blocks/upsert` inside a `Promise.all` when saving the full hierarchy.

## Error Handling

Both endpoints return `400` with detailed `errors` array for validation issues or descriptive `message` strings (e.g., duplicated zones). Treat these as actionable toasts/snackbars on the frontend.

## Suggested React Query Flow

```ts
const useBulkSyncStructure = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ blocks, segs }: { blocks: BlockPayload[]; segs: SegPayload[] }) => {
      await Promise.all([
        fetchJson("/api/blocks/upsert", blocks),
        fetchJson("/api/segs/upsert", segs),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocks"] });
      qc.invalidateQueries({ queryKey: ["segs"] });
      qc.invalidateQueries({ queryKey: ["zones"] });
    },
  });
};
```

Keep payloads minimal (only changed entities) to avoid unnecessary writes, yet you still benefit from atomic updates across the hierarchy.



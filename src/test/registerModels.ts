/**
 * Registers Mongoose models for integration tests.
 * Import lazily from setup after connect so vi.mock in test files can bind first.
 */
import "../modules/analog-slices/models/AnalogSlice.js";
import "../modules/analogs/models/Analog.js";
import "../modules/variants/models/Variant.js";
import "../modules/arts/models/Art.js";
import "../modules/btrade-slices/models/BtradeSlice.js";
import "../modules/asks/models/Ask.js";
import "../modules/kasks/models/Kask.js";
import "../modules/auth/models/User.js";
import "../modules/blocks/models/Block.js";
import "../modules/constants/models/Constant.js";
import "../modules/defs/models/Def.js";
import "../modules/dels/models/Del.js";
import "../modules/konks/models/Konk.js";
import "../modules/prods/models/Prod.js";
import "../modules/pallets/models/Pallet.js";
import "../modules/pallet-groups/models/PalletGroup.js";
import "../modules/poses/models/Pos.js";
import "../modules/rows/models/Row.js";
import "../modules/segs/models/Seg.js";
import "../modules/skugrs/models/Skugr.js";
import "../modules/skus/models/Sku.js";
import "../modules/sku-slices/models/SkuSlice.js";
import "../modules/zones/models/Zone.js";

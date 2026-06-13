import dotenv from "dotenv";

import { configureDnsForMongoSrv } from "./configureDnsForMongoSrv.js";

configureDnsForMongoSrv();
dotenv.config();

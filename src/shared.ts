require("dotenv").config();

import { log } from "@lightbase/logger";
import { db } from "./services";
import { checkRequiredEnvKeys, NODE_ENV, setProcessListeners } from "./utils";

/**
 * Setup the process, connects to DB
 */
export function init(envKeys: string[]) {
  setProcessListeners();
  checkRequiredEnvKeys(envKeys);
  log.info("Bootstrapping app", { env: NODE_ENV });
  db.connect();
}

import { log } from "@lightbase/logger";
import { getApp } from "./server";
import { init } from "./shared";

/**
 * Entrypoint for the API
 * For api docs, see the docs folder
 */
async function main() {
  init(["NODE_ENV", "SERVER_PORT", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]);

  const app = await getApp();
  app.listen(Number(process.env.SERVER_PORT), "0.0.0.0");
}

main().catch(log.error);

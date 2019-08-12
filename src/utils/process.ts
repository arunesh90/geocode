import { log } from "@lightbase/logger";

/**
 * Modify process listener count, add general event listeners
 */
export function setProcessListeners(): void {
  process.setMaxListeners(0);
  process.on("unhandledRejection", (reason, promise) => log.error({ reason, promise }));
  process.on("exit", code => {
    log.info(`Exiting with code: ${code}.`);
  });
}

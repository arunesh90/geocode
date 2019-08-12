import { Logger } from "@lightbase/logger";
import { exec, ExecOptions } from "child_process";
import { default as v4 } from "uuid/v4";

/**
 * Check if provided value is null or undefined with a typescript type guard
 * @param value
 */
export function isNil<T>(value: T | null | undefined): value is null | undefined {
  return value === undefined || value === null;
}

/**
 * Returns a uuid v4
 * Mainly a QoL function because of how uuid is exported
 */
export function uuid(): string {
  return v4();
}

interface ExecuteResult {
  stdout: string;
  stderr: string;
}

/**
 * Promise wrapper around child_process#exec
 * Will also print current memory usage of this process and run GC if available
 * Note: v8 specifies that even if the GC is called, it's merely a hint to run the GC and not
 * guaranteed.
 */
export async function promisifyExecCommand(
  logger: Logger,
  command: string,
  opts: ExecOptions & { encoding?: string } = { encoding: "utf8" },
  runGC: boolean = false,
): Promise<ExecuteResult> {
  const before = process.memoryUsage();

  // @ts-ignore
  return new Promise<ExecuteResult>((resolve, reject) => {
    exec(command, opts, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        if (runGC && !isNil(global.gc)) {
          global.gc();
        }
        const after = process.memoryUsage();

        logger.info("Memory usage", {
          before: before.rss / 1024,
          after: after.rss / 1024,
        });

        resolve({
          stdout,
          stderr,
        });
      }
    });
  });
}

export function getSecondsSinceEpoch(): number {
  return Math.floor(Date.now() / 1000);
}

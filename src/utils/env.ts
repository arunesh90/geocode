import { isNil } from "./stdlib";

export const NODE_ENV = (process.env.NODE_ENV || "development").toLowerCase();
export const IS_PRODUCTION = NODE_ENV === "production";

/**
 * checkRequiredEnvKeys loops through the list of provided keys
 * and throws an error if the key is not available in the process environment
 */
export function checkRequiredEnvKeys(keys: string[]): void {
  for (const key of keys) {
    if (isNil(process.env[key])) {
      throw new Error(`Missing ${key} in environment`);
    }
  }
}

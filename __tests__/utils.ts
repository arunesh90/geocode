import "jest";
import { log } from "@lightbase/logger";
import {
  checkRequiredEnvKeys,
  InvalidDataError,
  NotFoundError,
  promisifyExecCommand,
  uuid,
  isNil,
} from "../src/utils";

test("checkRequiredEnvKeys", () => {
  expect(() => checkRequiredEnvKeys(["PATH"])).not.toThrow();
  expect(() => checkRequiredEnvKeys(["FOO"])).toThrow();
});

test("error prototypes", () => {
  expect(new NotFoundError()).toBeInstanceOf(NotFoundError);
  expect(new InvalidDataError()).toBeInstanceOf(InvalidDataError);
});

test("isNil", () => {
  expect(isNil(null)).toBe(true);
  expect(isNil(undefined)).toBe(true);
  expect(isNil(true)).toBe(false);
  expect(isNil(false)).toBe(false);
  expect(isNil("")).toBe(false);
  expect(isNil("asdf")).toBe(false);
  expect(isNil(0)).toBe(false);
  expect(isNil(15)).toBe(false);
  expect(isNil(15.23)).toBe(false);
  expect(isNil([])).toBe(false);
  expect(isNil([22])).toBe(false);
  expect(isNil({})).toBe(false);
  expect(isNil({ foo: "foo" })).toBe(false);
});

test("uuid", () => {
  expect(uuid()).not.toBe(uuid());
});

test("promisifyExecCommand", () => {
  expect(promisifyExecCommand(log, "ls")).resolves.toHaveProperty("stderr");
  expect(promisifyExecCommand(log, "ls", { encoding: "utf-8" }, true)).resolves.toHaveProperty("stdout");
});

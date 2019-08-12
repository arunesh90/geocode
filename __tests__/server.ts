import "jest";

import { log } from "@lightbase/logger";
import { ValidationError } from "yup";
import { errorHandler } from "../src/server";
import { notFoundHandler } from "../src/server/middleware/notFoundHandlerr";
import { AppContext, InvalidDataError, NotFoundError } from "../src/utils";

test("errorHandler", async () => {
  const mock = jest.fn();
  let ctx: AppContext = { log } as any;

  mock.mockReturnValueOnce(Promise.resolve());
  await errorHandler(ctx, mock);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.body).toBeUndefined();
  expect(ctx.status).toBeUndefined();

  mock.mockReset();
  ctx = { log } as any;
  mock.mockReturnValueOnce(Promise.reject(new Error()));
  await errorHandler(ctx, mock);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.status).toBe(500);

  mock.mockReset();
  ctx = { log } as any;
  mock.mockReturnValueOnce(Promise.reject(new InvalidDataError()));
  await errorHandler(ctx, mock);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.status).toBe(400);
  expect(ctx.body).not.toBeUndefined();

  mock.mockReset();
  ctx = { log } as any;
  mock.mockReturnValueOnce(Promise.reject(new NotFoundError()));
  await errorHandler(ctx, mock);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.status).toBe(404);
  expect(ctx.body).not.toBeUndefined();

  mock.mockReset();
  ctx = { log } as any;
  mock.mockReturnValueOnce(Promise.reject(new ValidationError("", "", "")));
  await errorHandler(ctx, mock);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.status).toBe(400);
  expect(ctx.body).not.toBeUndefined();
});

test("notFoundHandler", async () => {
  const mock = jest.fn();
  let ctx: AppContext = { status: 200 } as any;

  mock.mockResolvedValueOnce(Promise.resolve());
  await notFoundHandler(ctx, mock);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.status).toBe(200);

  mock.mockReset();
  mock.mockResolvedValueOnce(Promise.resolve());
  ctx = { status: 404 } as any;
  await expect(notFoundHandler(ctx, mock)).rejects.toBeInstanceOf(NotFoundError);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.status).toBe(404);

  mock.mockReset();
  mock.mockResolvedValueOnce(Promise.resolve());
  ctx = { status: undefined } as any;
  await expect(notFoundHandler(ctx, mock)).rejects.toBeInstanceOf(NotFoundError);
  expect(mock).toBeCalledTimes(1);
  expect(ctx.status).toBe(404);
});

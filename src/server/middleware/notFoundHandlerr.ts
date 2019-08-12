import { AppContext, NextFunction, NotFoundError } from "../../utils";

export async function notFoundHandler(ctx: AppContext, next: NextFunction) {
  await next();
  ctx.status = ctx.status || 404;
  if (ctx.status === 404) {
    throw new NotFoundError();
  }
}

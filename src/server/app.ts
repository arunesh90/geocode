import { koaMiddleware as requestLogger } from "@lightbase/logger";
import { default as Koa } from "koa";
import { default as compress } from "koa-compress";
import { default as helmet } from "koa-helmet";
import { AppContext, NextFunction } from "../utils";
import { bodyHandler, corsHandler, errorHandler } from "./middleware";
import { notFoundHandler } from "./middleware/notFoundHandlerr";

/**
 * Basic Koa setup with
 * - Logging (@lightbase/logger)
 * - Error handling (custom)
 * - 404 handling  (custom)
 * - Few security headers (koa-helmet)
 * - cors handler (koa2-cors, allow all)
 * - body parser (koa-body, no file uploads)
 * - public health route, that always returns 200 (custom, note matches all urls that start with /health)
 */
export function getApp() {
  const app = new Koa();

  app.use(async (ctx: AppContext, next: NextFunction) => {
    if (ctx.URL.pathname === "/health" || ctx.URL.pathname.startsWith("/health")) {
      ctx.body = {};
    } else {
      return next();
    }
  });

  app.use(requestLogger({}));
  app.use(errorHandler);
  app.use(notFoundHandler);
  app.use(helmet());
  app.use(corsHandler);
  app.use(bodyHandler);
  app.use(compress());

  return app;
}

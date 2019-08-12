import { Logger } from "@lightbase/logger";
import * as Koa from "koa";
import { IRouterContext } from "koa-router";

export type NextFunction = () => Promise<any | void>;
export type AppContext = Koa.ParameterizedContext<
  {},
  IRouterContext & {
    log: Logger;
  }
>;

export type AppMiddleware = (ctx: AppContext, next: NextFunction) => Promise<void>;

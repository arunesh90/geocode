import { default as cors } from "koa2-cors";

export const corsHandler = cors({
  credentials: true,
  origin: ctx => {
    return ctx.get("Origin");
  },
});

import { default as koaBody } from "koa-body";

export const bodyHandler = koaBody({
  jsonLimit: 5 * 1024 * 1024, // 5mb
});

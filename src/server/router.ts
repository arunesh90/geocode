import { convertAddress, convertAddressBatch, convertClosest } from "../convert";
import { suggestCity, suggestNumber, suggestStreet } from "../suggest";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Router = require("koa-router");

// Create router and put on the provided app
export function mountRouter(app: any) {
  const router = new Router({});

  router.all("/suggest/city", suggestCity);
  router.all("/suggest/street", suggestStreet);
  router.all("/suggest/number", suggestNumber);

  router.post("/convert/closest", convertClosest);

  router.post("/convert/address/batch", convertAddressBatch);
  router.post("/convert/address", convertAddress);

  app.use(router.middleware()).use(router.allowedMethods());
}

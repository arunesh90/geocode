import "jest";
import * as supertest from "supertest";

import { getApp } from "../../src/server";
import { mountRouter } from "../../src/server/router";
import { init } from "../../src/shared";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const request = require("supertest");

async function app() {
  init([]);
  const app = await getApp();
  mountRouter(app);

  return request(app.callback() as any);
}

test("E2E suggest", () => {});

if (process.env.E2E) {
  test("ALL /suggest/city", async () => {
    // Find Utrecht
    await (await app())
      .get("/suggest/city?city=U")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("cities");
        expect(res.body.cities).toHaveLength(26);
      });

    // Find Utrecht
    await (await app())
      .post("/suggest/city?city=Utr")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("cities");
        expect(res.body.cities).toHaveLength(1);
      });

    // Non existent city prefix
    await (await app())
      .get("/suggest/city?city=Utri")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("cities");
        expect(res.body.cities).toHaveLength(0);
      });
  });

  test("/suggest/city validation", async () => {
    // city not found in query
    await (await app())
      .get("/suggest/city")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // empty city in query
    await (await app())
      .get("/suggest/city?city=")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // strip % sign
    await (await app())
      .get("/suggest/city?city=U%")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // strip _ sign
    await (await app())
      .get("/suggest/city?city=_U")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });
  });

  test("ALL /suggest/street", async () => {
    // Find Utrecht -> Domplein
    await (await app())
      .get("/suggest/street?city=Utrecht&street=Domp")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("streets");
        expect(res.body.streets).toHaveLength(1);
      });

    // Non existent street
    await (await app())
      .get("/suggest/street?city=Utrecht&street=Domplijn")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("streets");
        expect(res.body.streets).toHaveLength(0);
      });
  });

  test("/suggest/street validation", async () => {
    // no city query parameter
    await (await app())
      .get("/suggest/street?")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // empty city query parameter
    await (await app())
      .get("/suggest/street?city=")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // no street query parameter
    await (await app())
      .get("/suggest/street?city=Utrecht")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // empty street query parameter
    await (await app())
      .get("/suggest/street?city=Utrecht&street=")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // strip % sign
    await (await app())
      .get("/suggest/street?city=Utrecht&street=S%")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // strip _ sign
    await (await app())
      .get("/suggest/street?city=Utrecht&street=_S")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });
  });

  test("ALL /suggest/number", async () => {
    // Fetch all housenumbers for Utrecht -> Domplein
    await (await app())
      .get("/suggest/number?city=Utrecht&street=Domplein")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("numbers");
        expect(res.body.numbers).toHaveLength(27);
      });

    // post
    await (await app())
      .post("/suggest/number?city=Utrecht&street=Domplein")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("numbers");
        expect(res.body.numbers).toHaveLength(27);
      });
  });

  test("/suggest/number validation", async () => {
    // no city query parameter
    await (await app())
      .get("/suggest/number")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // empty city query parameter
    await (await app())
      .get("/suggest/number?city=")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // no street query parameter
    await (await app())
      .get("/suggest/number?city=Utrecht")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // empty street query parameter
    await (await app())
      .get("/suggest/number?city=Utrecht&street=")
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // no results
    await (await app())
      .get("/suggest/number?city=Utrecht&street=Dompleins")
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("numbers");
        expect(res.body.numbers).toHaveLength(0);
      });
  });
}

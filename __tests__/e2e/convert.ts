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

test("E2E convert", () => {});

if (process.env.E2E) {
  test("POST /convert/address", async () => {
    // Lightbase office conversion
    await (await app())
      .post("/convert/address")
      .send({
        zip: "3511ED",
        number: 32,
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("city");
        expect(res.body).toHaveProperty("street");
        expect(res.body).toHaveProperty("streetnumber");
        expect(res.body).toHaveProperty("addition");
        expect(res.body).toHaveProperty("zip");
        expect(res.body).toHaveProperty("lat");
        expect(res.body).toHaveProperty("lon");
      });

    // Non existent address
    await (await app())
      .post("/convert/address")
      .send({
        zip: "3511ED",
        number: 999,
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });
  });

  test("/convert/address validation", async () => {
    // No zip and number
    await (await app())
      .post("/convert/address")
      .send({})
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // No number
    await (await app())
      .post("/convert/address")
      .send({
        zip: "3511ED",
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // invalid zip
    await (await app())
      .post("/convert/address")
      .send({
        zip: "ED3511",
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // invalid number
    await (await app())
      .post("/convert/address")
      .send({
        zip: "3511ED",
        number: "foo",
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // strips addition if not a string
    await (await app())
      .post("/convert/address")
      .send({
        zip: "3511ED",
        number: 32,
        addition: 8,
      })
      .expect(200);

    // not found with addition
    await (await app())
      .post("/convert/address")
      .send({
        zip: "3511ED",
        number: 32,
        addition: "8",
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });
  });

  test("POST /convert/address/batch", async () => {
    // no batch specified
    await (await app())
      .post("/convert/address/batch")
      .send({})
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // batch should be array
    await (await app())
      .post("/convert/address/batch")
      .send({
        batch: "",
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // batch should have length > 0
    await (await app())
      .post("/convert/address/batch")
      .send({
        batch: [],
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // batch max items
    await (await app())
      .post("/convert/address/batch")
      .send({
        batch: [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          141,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23,
          24,
          25,
          26,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          141,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23,
          24,
          25,
          26,
        ],
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // single item batch
    await (await app())
      .post("/convert/address/batch")
      .send({
        batch: [{ zip: "3511ED", number: 32 }],
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("batch");
        expect(res.body.batch).toHaveLength(1);
      });

    // skips unknown addressees
    await (await app())
      .post("/convert/address/batch")
      .send({
        batch: [{ zip: "3511ED", number: 32 }, { zip: "3511ED", number: 999 }],
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("batch");
        expect(res.body.batch).toHaveLength(1);
      });
  });

  test("POST /convert/closest", async () => {
    // "lat": "52.0916239700314", "lon": "5.1097562832579" <- Lightbase office

    // around Lightbase office
    await (await app())
      .post("/convert/closest")
      .send({
        lat: "52.0916239700314",
        lon: "5.1097562832579",
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("list");
        expect(res.body.list).toHaveLength(10);
      });

    // Take correct amount of items
    await (await app())
      .post("/convert/closest")
      .send({
        lat: 52.0916239700314,
        lon: 5.1097562832579,
        take: 5,
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("list");
        expect(res.body.list).toHaveLength(5);
      });

    // Use distance
    await (await app())
      .post("/convert/closest")
      .send({
        lat: 52.0916239700314,
        lon: 5.1097562832579,
        distance: 0.001,
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("list");
        expect(res.body.list).toHaveLength(2);
      });

    // validation

    // No lat, lon specified
    await (await app())
      .post("/convert/closest")
      .send({})
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // No lon specified
    await (await app())
      .post("/convert/closest")
      .send({
        lat: 52.0916239700314,
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // invalid lat specified
    await (await app())
      .post("/convert/closest")
      .send({
        lat: "ff",
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // invalid lon specified
    await (await app())
      .post("/convert/closest")
      .send({
        lat: 52.0916239700314,
        lon: "ff",
      })
      .expect(400)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("message");
      });

    // defaults
    // accepts high distance, should use max
    await (await app())
      .post("/convert/closest")
      .send({
        lat: 52.0916239700314,
        lon: 5.1097562832579,
        distance: 175,
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("list");
        expect(res.body.list).toHaveLength(10);
      });

    // invalid distance, use default
    await (await app())
      .post("/convert/closest")
      .send({
        lat: 52.0916239700314,
        lon: 5.1097562832579,
        distance: "ee",
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("list");
        expect(res.body.list).toHaveLength(10);
      });

    // skip, take work properly
    await (await app())
      .post("/convert/closest")
      .send({
        lat: 52.0916239700314,
        lon: 5.1097562832579,
        skip: 1,
        take: 2,
      })
      .expect(200)
      .expect((res: supertest.Response) => {
        expect(res.body).toHaveProperty("list");
        expect(res.body.list).toHaveLength(2);
      });
  }, 20000);
}

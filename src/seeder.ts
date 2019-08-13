import { log } from "@lightbase/logger";
import { promises as fs, createReadStream } from "fs";
import { pipeline, Writable } from "stream";
import { promisify } from "util";
import { db } from "./services";
import { init } from "./shared";
import { promisifyExecCommand } from "./utils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const csvParser = require("csv-parse");

const bagURL = "https://data.nlextract.nl/bag/csv/bag-adressen-laatst.csv.zip";

/**
 * Process bag csv dump
 * Depends on unzip, wget and (gnu) core-utils
 * Fetches csv, resets database and inserts new data.
 */
async function main() {
  init(["NODE_ENV", "DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"]);

  log.info("Resetting db.");
  db.connect();
  await db.query("SELECT 1 + 1 as result").catch(e => {
    log.info("Could not connect to database", { e });
    process.exit(1);
  });
  await initDb();
  log.info("Done resetting db.");

  log.info("Creating tmp directory");
  await fs.mkdir("./tmpDir").catch(e => {
    log.info("Please remove left over artifacts of a previous run", { e });
    return;
  });

  log.info("Fetching latest");
  await exec(`wget ${bagURL} -O ./tmpDir/tmp.zip`);
  log.info("Unzipping contents");
  await exec(`unzip ./tmpDir/tmp.zip -d ./tmpDir`);

  log.info("Remove unused columns");
  await exec(`cut -f1,2,3,4,5,6,14,15 -d\\; ./tmpDir/bagadres.csv > ./tmpDir/clean.csv`);

  log.info("Start seeding db");
  await processCsv(`./tmpDir/clean.csv`);
  log.info("Finalize db structure");
  await finalizeDb();

  log.info("Clean up files");
  await fs.unlink("./tmpDir/tmp.zip");
  await fs.unlink("./tmpDir/bagadres.csv");
  await fs.unlink("./tmpDir/clean.csv");
  await fs.rmdir("./tmpDir");
}

// Use default values around exec
async function exec(command: string) {
  return promisifyExecCommand(log, command, { encoding: "utf-8" }, true);
}

// Drop existing tables and indices and create the new bag_info
async function initDb() {
  await db.query("DROP MATERIALIZED VIEW IF EXISTS city_street;");
  await db.query("DROP TABLE IF EXISTS bag_info;");
  await db.query(`CREATE TABLE bag_info (
  id bigserial primary key,
  city varchar(255),
  street varchar(255),
  streetNumber int,
  addition varchar(255) NOT NULL DEFAULT '',
  zip varchar(6),
  lat numeric(15, 13),
  lon numeric(15, 13)
);`);
}

// Create new indices and materialized view
async function finalizeDb() {
  await db.query("CREATE INDEX city_street_number_idx ON bag_info (city, street, streetNumber);");
  await db.query("CREATE INDEX zip_idx ON bag_info (zip, streetNumber);");
  await db.query("CREATE INDEX lat_lon_idx ON bag_info (lat, lon);");
  await db.query(
    "CREATE MATERIALIZED VIEW city_street AS SELECT DISTINCT city, street FROM bag_info WITH DATA;",
  );
  await db.query("CREATE INDEX city_street_idx ON city_street (city, street);");
}

// Streaming csv parser -> batch inserter
async function processCsv(file: string): Promise<void> {
  return promisify(pipeline)(
    createReadStream(file, {
      encoding: "utf8",
      autoClose: true,
    }),
    csvParser({
      delimiter: ";",
      auto_parse: false,
      relax: true,
    }),
    new StreamToDb(),
  );
}

/**
 * Transforms and batch inserts items in to the database.
 */
class StreamToDb extends Writable {
  private static batchSize = 14000;
  private writeQueue: Row[];
  private counter: number = 0;

  constructor() {
    super({
      objectMode: true,
      highWaterMark: StreamToDb.batchSize,
    });

    this.writeQueue = [];
  }

  _write(chunk: any, encoding: any, callback: any) {
    this.counter += 1;
    if (this.counter % 10000 === 0) {
      log.info(`Counter: ${this.counter}`);
    }

    // Transform, skip first row
    if (chunk[0] === "openbareruimte") {
      return callback(null);
    } else {
      this.writeQueue.push({
        street: chunk[0],
        streetNumber: Number(chunk[1]),
        addition: chunk[2] + chunk[3],
        zip: chunk[4],
        city: chunk[5],
        lon: chunk[6],
        lat: chunk[7],
      });
    }

    if (this.writeQueue.length >= StreamToDb.batchSize) {
      this.writeInternal(callback);
    } else {
      // This construct allows the event loop to do other stuff.
      // This is only needed here, because the 'if-block' already does async stuff.
      // With some benchmarking this made speed it up a bit.
      if (this.counter % 1000 === 0) {
        setImmediate(() => {
          callback(null);
        });
      } else {
        callback(null);
      }
    }
  }

  // insert the queue and reset the values
  private writeInternal(callback: (err: null | Error) => void) {
    if (this.writeQueue.length === 0) {
      return callback(null);
    }
    batchInsert(this.writeQueue)
      .then(() => {
        this.writeQueue.length = 0;
        this.writeQueue = [];
        setImmediate(() => {
          callback(null);
        });
      })
      .catch(e => {
        if (e) {
          log.error(e);
          callback(e);
        } else {
          callback(null);
        }
      });
  }

  public _final(callback: (error?: Error | null) => void): void {
    // Process the final batch that is in memory.
    log.info(`Final handler: ${this.counter}`);
    this.writeInternal(callback);
  }
}

main().catch(log.error);

interface Row {
  city: string;
  street: string;
  streetNumber: number;
  addition: string;
  zip: string;
  lat: string;
  lon: string;
}

// Given a queue, will split it up it batches and insert those
async function batchInsert(queue: Row[]) {
  const batchSize = 3000;
  let current = 0;

  while (current < queue.length) {
    const max = Math.min(queue.length, current + batchSize);
    const slice = queue.slice(current, max);

    let firstNoComma = true;
    let query = "INSERT INTO bag_info VALUES ";
    const args = [];
    let argCounter = 1;
    for (const v of slice) {
      if (firstNoComma) {
        firstNoComma = false;
      } else {
        query += ", ";
      }

      args.push(v.city, v.street, v.streetNumber, v.addition, v.zip, v.lat, v.lon);
      query += `(DEFAULT, \$${argCounter++}, \$${argCounter++}, \$${argCounter++}, \$${argCounter++}, \$${argCounter++}, \$${argCounter++}, \$${argCounter++})`;
    }
    query += ";";

    try {
      await db.query(query, args);
    } catch (e) {
      log.error({ e, query, args });
    }
    current = max;
  }
}

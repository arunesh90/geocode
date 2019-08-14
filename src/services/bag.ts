import { log } from "@lightbase/logger";
import { db } from "./database";

interface BagInfo {
  city: string;
  street: string;
  streetnumber: number;
  addition: string;
  zip: string;
  lat: number;
  lon: number;
}

export async function bagGetNumbersForCityAndStreet(city: string, street: string): Promise<number[]> {
  const result = await db.query<{ streetnumber: number }>(
    "SELECT DISTINCT streetnumber FROM bag_info WHERE city = $1 AND street = $2",
    [city, street],
  );

  return result.map(it => it.streetnumber);
}

export async function bagConvertAddressToBag(
  zip: string,
  number: number,
  addition: string,
): Promise<BagInfo | undefined> {
  return db.queryFirst<BagInfo>(
    "SELECT city, street, streetnumber, addition, zip, lat, lon FROM bag_info WHERE zip = $1 AND streetnumber = $2 AND addition = $3",
    [zip, number, addition],
  );
}

// Does not guarantee return order
export async function bagConvertAddressesToBags(
  addresses: { zip: string; number: number; addition: string }[],
): Promise<BagInfo[]> {
  const args = [];
  let argCount = 1;

  let q = `SELECT city, street, streetnumber, addition, zip, lat, lon FROM bag_info WHERE `;
  let isFirstOne = true;

  for (const address of addresses) {
    if (isFirstOne) {
      isFirstOne = false;
    } else {
      q += " OR ";
    }

    q += `(zip = \$${argCount++} AND streetnumber = \$${argCount++} AND addition = \$${argCount++})`;
    args.push(address.zip, address.number, address.addition);
  }

  return db.query<BagInfo>(q, args);
}

export async function bagConvertClosest({
  lat,
  lon,
  distance,
  skip,
  take,
}: {
  lat: string;
  lon: string;
  distance: number;
  skip: number;
  take: number;
}): Promise<(BagInfo & { distance: number })[]> {
  const KM_CONSTANT = 111.045;
  const mapping = {
    lat: "$1",
    lon: "$2",
    distance: "$3",
    skip: "$4",
    take: "$5",
  };

  let query = `
WITH distance_calc as (
  WITH distance_bound as (
    SELECT *
    FROM bag_info
    WHERE (lat BETWEEN ${mapping.lat} - (${mapping.distance} / ${KM_CONSTANT})
            AND ${mapping.lat} + (${mapping.distance} / ${KM_CONSTANT})
      ) AND (lon BETWEEN ${mapping.lon} - (${mapping.distance} / (${KM_CONSTANT} * cos(radians(${mapping.lat}))))
            AND ${mapping.lon} + (${mapping.distance} / (${KM_CONSTANT} * cos(radians(${mapping.lat}))))
      )
  )
  SELECT 
    DISTINCT ON (distance_bound.id)
    city,
    street,
    streetnumber,
    addition,
    zip,
    lat,
    lon,
    (
      ${KM_CONSTANT} *
      degrees(acos(cos(radians(${mapping.lat})) *
      cos(radians(lat)) *
      cos(radians(lon) -
      radians(${mapping.lon})) +
      sin(radians(${mapping.lat})) *
      sin(radians(lat))))
    ) as distance
  FROM distance_bound
)
SELECT *
FROM distance_calc
WHERE distance < ${mapping.distance}
ORDER BY distance ASC
LIMIT ${mapping.take}
OFFSET ${mapping.skip}
`;

  query = query.replace(/\s+/g, " ");
  log.info({ query, args: { lat, lon, distance, skip, take } });

  return db.query<BagInfo & { distance: number }>(query, [lat, lon, distance, skip, take]);
}

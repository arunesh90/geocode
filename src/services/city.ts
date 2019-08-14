import { db } from "./database";

export async function cityGetWithPrefix(prefix: string): Promise<string[]> {
  const result = await db.query<{ city: string }>(
    "SELECT DISTINCT city FROM city_street WHERE city LIKE $1",
    [`${prefix}%`],
  );

  return result.map(it => it.city);
}

export async function cityGetStreetWithPrefix(city: string, prefix: string): Promise<string[]> {
  const result = await db.query<{ street: string }>(
    "SELECT street FROM city_street WHERE city = $1 AND street LIKE $2",
    [city, `${prefix}%`],
  );

  return result.map(it => it.street);
}

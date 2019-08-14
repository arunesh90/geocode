import { log } from "@lightbase/logger";
import { InvalidDataError, isNil } from "../utils";

export interface ValidatedAddress {
  zip: string;
  number: number;
  addition: string;
}

// Only accepts uppercase letters and no spaces
const zipRegex = new RegExp(/^\d{4}[A-Z]{2}$/g);

// Validate zip, number and addition
export function validateAddress(zip?: string, number?: string, addition?: unknown): ValidatedAddress {
  // we need to reset the state, because we reuse the regex
  zipRegex.lastIndex = 0;

  if (isNil(zip) || !zipRegex.test(zip)) {
    log.info({ zip, number, addition });
    throw new InvalidDataError("zip is a required property, and should be in format: 1234AB");
  }
  if (isNil(number) || isNaN(Number(number))) {
    throw new InvalidDataError("number is a required property, and should be a number");
  }

  return {
    zip,
    number: Number(number),
    addition: addition && typeof addition === "string" ? addition : "",
  };
}

export interface ValidatedClosest {
  lat: string;
  lon: string;
  distance: number;
  skip: number;
  take: number;
}

// Default values, may need some tuning once the postgres query is in place
const distanceDefault = 2;
const skipDefault = 0;
const takeDefault = 10;
const distanceMax = 15;
const takeMax = 100;

// Validate and set defaults for latitude, longitude, distance, skip and take
export function validateClosest(
  lat?: unknown,
  lon?: unknown,
  distance?: unknown,
  skip?: unknown,
  take?: unknown,
): ValidatedClosest {
  if (isNil(lat) || isNil(lon)) {
    throw new InvalidDataError("lat and lon are required properties");
  }

  if (isNaN(Number(lat)) || isNaN(Number(lon))) {
    throw new InvalidDataError("lat and lon should be a number or a string representation of a number");
  }

  const usedDistance = !isNaN(Number(distance)) ? Math.min(distanceMax, Number(distance)) : distanceDefault;
  const usedSkip = !isNaN(Number(skip)) ? Number(skip) : skipDefault;
  const usedTake = !isNaN(Number(take)) ? Math.min(takeMax, Number(take)) : takeDefault;

  return {
    lat: String(lat),
    lon: String(lon),
    distance: usedDistance,
    skip: usedSkip,
    take: usedTake,
  };
}

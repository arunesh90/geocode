import { bagGetNumbersForCityAndStreet } from "../services/bag";
import { cityGetStreetWithPrefix, cityGetWithPrefix } from "../services/city";
import { AppContext, InvalidDataError, isNil, NextFunction } from "../utils";

// Suggest cities with the same prefix as provided
export async function suggestCity(ctx: AppContext, next: NextFunction) {
  const { city } = ctx.query;
  if (isNil(city) || city.length < 1) {
    throw new InvalidDataError("query parameter city should be at least 1 character");
  }
  if (city.replace(/[%_]/g, "") !== city) {
    throw new InvalidDataError("query parameter city is an invalid string.");
  }

  ctx.body = {
    cities: await cityGetWithPrefix(city),
  };

  return next();
}

// Suggest streets with the provided city and prefix
export async function suggestStreet(ctx: AppContext, next: NextFunction) {
  const { city, street } = ctx.query;

  if (isNil(city) || city.length < 1) {
    throw new InvalidDataError("query parameter city should be at least 1 character");
  }
  if (isNil(street) || street.length < 1) {
    throw new InvalidDataError("query parameter street should be at least 1 character");
  }

  if (street.replace(/[%_]/g) !== street) {
    throw new InvalidDataError("query parameter street is an invalid string.");
  }

  ctx.body = {
    streets: await cityGetStreetWithPrefix(city, street),
  };

  return next();
}

// Get all numbers for the provided city and street
export async function suggestNumber(ctx: AppContext, next: NextFunction) {
  const { city, street } = ctx.query;

  if (isNil(city) || city.length < 1) {
    throw new InvalidDataError("query parameter city should be at least 1 character");
  }
  if (isNil(street) || street.length < 1) {
    throw new InvalidDataError("query parameter street should be at least 1 character");
  }

  ctx.body = {
    numbers: await bagGetNumbersForCityAndStreet(city, street),
  };

  return next();
}

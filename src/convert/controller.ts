import { bagConvertAddressesToBags, bagConvertAddressToBag, bagConvertClosest } from "../services/bag";
import { AppContext, InvalidDataError, isNil, NextFunction } from "../utils";
import { validateAddress, validateClosest, ValidatedAddress } from "./validation";

// Find closest addresses to provided lat and lon values
export async function convertClosest(ctx: AppContext, next: NextFunction) {
  const { lat, lon, distance, skip, take } = ctx.request.body;

  const closest = validateClosest(lat, lon, distance, skip, take);

  ctx.body = {
    list: await bagConvertClosest(closest),
  };

  return next();
}

// Convert zip and number to full address
export async function convertAddress(ctx: AppContext, next: NextFunction) {
  const { zip, number, addition } = ctx.request.body;
  const address = validateAddress(zip, number, addition);

  const bag = await bagConvertAddressToBag(address.zip, address.number, address.addition);
  if (isNil(bag)) {
    throw new InvalidDataError("invalid address provided");
  }

  ctx.body = bag;

  return next();
}

// Convert batch of zips and numbers to full addresses
export async function convertAddressBatch(ctx: AppContext, next: NextFunction) {
  const batch = ctx.request.body.batch;
  if (isNil(batch) || !Array.isArray(batch) || batch.length === 0 || batch.length > 50) {
    throw new InvalidDataError("batch property in body should be an array between 0 and 50 items");
  }

  const addresses: ValidatedAddress[] = [];
  for (const item of batch) {
    if (isNil(item)) {
      throw new InvalidDataError("invalid item in batch");
    }
    addresses.push(validateAddress(item.zip, item.number, item.addition));
  }

  ctx.body = {
    batch: await bagConvertAddressesToBags(addresses),
  };

  return next();
}

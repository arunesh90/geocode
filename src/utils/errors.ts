/**
 * Used for returning a 404 to the client
 */
export class NotFoundError extends Error {
  constructor(args?: any) {
    super(args);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Used to return a 401 to the client
 */
export class InvalidDataError extends Error {
  constructor(args?: any) {
    super(args);
    Object.setPrototypeOf(this, InvalidDataError.prototype);
  }
}

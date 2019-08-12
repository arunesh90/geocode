import * as Yup from "yup";
import { AppContext, InvalidDataError, isNil, NextFunction, NotFoundError } from "../../utils";

/**
 * Handles the higher app errors
 */
export const errorHandler = async (ctx: AppContext, next: NextFunction) => {
  try {
    await next();
  } catch (error) {
    switch (error.constructor) {
      case Yup.ValidationError:
        ctx.log.error(error);
        ctx.status = 400;
        ctx.body = {
          error,
        };
        break;
      case NotFoundError:
        ctx.status = 404;
        ctx.body = {
          message: "Not found",
        };
        break;
      case InvalidDataError:
        if (!isNil(error.message)) {
          ctx.log.error(error);
        }

        ctx.status = 400;
        ctx.body = {
          message: error.message || "Invalid data(-structure) please look at the docs.",
        };
        break;
      default:
        ctx.log.error(error);
        ctx.status = 500;
    }
  }
};

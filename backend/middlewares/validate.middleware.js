import ApiError from "../utils/ApiError.js";

export function requireBody(fields = []) {
  return (req, res, next) => {
    for (const f of fields) {
      if (req.body[f] === undefined || req.body[f] === null) {
        return next(new ApiError(400, `Missing required field '${f}'`));
      }
    }
    next();
  };
}

export function requireParams(fields = []) {
  return (req, res, next) => {
    for (const f of fields) {
      if (!req.params[f]) {
        return next(new ApiError(400, `Missing required param '${f}'`));
      }
    }
    next();
  };
}

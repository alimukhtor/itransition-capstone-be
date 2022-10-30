import createHttpError from "http-errors";

export const adminOnly = async (req, res, next) => {
  if (!(req.user.role === "admin"))
    return next(createHttpError(401, "You are not authorized to do this"));
  next();
};

export const adminAndUserOnly = async (req, res, next) => {
  if (!(req.user.role === "admin" || req.user.role === "user"))
    return next(createHttpError(401, "You are not authorized to do this"));
  next();
};

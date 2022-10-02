import createHttpError from "http-errors";
import { verifyJWT } from "./tools.js";

export const JWTAuthMiddleware = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      next(createHttpError(401, "please provide bearer token in authorization headers!"));
    } else {
      const token = req.headers.authorization.replace("Bearer ", "");
      const payload = await verifyJWT(token);
      req.user = {
        _id: payload._id,
        role: payload.role,
      };
      next();
    }
  } catch (error) { 
    next(createHttpError(401, "User is unauthorized!"));
  }
};

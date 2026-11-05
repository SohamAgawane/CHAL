import jwt from "jsonwebtoken";
import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

interface AccessTokenPayload {
  _id: string;
  email?: string;
  name?: string;
}

export const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token =
    req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized — no token provided");
  }

  let decoded: AccessTokenPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AccessTokenPayload;
  } catch (err) {
    throw new ApiError(401, "Unauthorized — invalid or expired token");
  }

  const user = await User.findById(decoded._id).select("-password -refreshToken");

  if (!user) {
    throw new ApiError(401, "Unauthorized — user not found");
  }

  req.user = user;
  next();
});

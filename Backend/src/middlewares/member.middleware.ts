import { Join } from "../models/Join.model.js";
import { Plan } from "../models/Plan.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { JOIN_STATUS } from "../constants.js";

// Allows access only to approved members OR the host of the plan
export const checkIsMember = asyncHandler(async (req, _res, next) => {
  const { id: planId } = req.params;
  const userId = req.user!._id;

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  // Host always has access
  if (plan.hostedBy.toString() === userId.toString()) {
    return next();
  }

  const join = await Join.findOne({
    planId,
    userId,
    status: JOIN_STATUS.APPROVED,
  });

  if (!join) {
    throw new ApiError(403, "Forbidden — only approved members can access this");
  }

  next();
});

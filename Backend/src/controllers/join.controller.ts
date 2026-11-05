import { Join } from "../models/Join.model.js";
import { Plan } from "../models/Plan.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { JOIN_STATUS } from "../constants.js";

interface MongoDuplicateKeyError {
  code?: number;
}

// POST /api/plans/:id/join 
const joinPlan = asyncHandler(async (req, res) => {
  const { id: planId } = req.params;
  const userId = req.user!._id;

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  if (plan.hostedBy.toString() === userId.toString()) {
    throw new ApiError(400, "You cannot join your own plan");
  }

  if (plan.joinedCount >= plan.totalSpots) {
    throw new ApiError(403, "This plan is full");
  }

  // isOpen = auto-approve; closed = pending
  const status = plan.isOpen ? JOIN_STATUS.APPROVED : JOIN_STATUS.PENDING;

  let join;
  try {
    join = await Join.create({ planId, userId, status });
  } catch (err) {
    if ((err as MongoDuplicateKeyError).code === 11000) {
      throw new ApiError(409, "You have already requested to join this plan");
    }
    throw err;
  }

  if (status === JOIN_STATUS.APPROVED) {
    await Plan.findByIdAndUpdate(planId, { $inc: { joinedCount: 1 } });

    // Emit real-time update
    const updatedPlan = await Plan.findById(planId).select("joinedCount totalSpots");
    req.app.get("io")?.to(`plan_${planId}`).emit("plan_joined", {
      planId,
      joinedCount: updatedPlan?.joinedCount,
      totalSpots: updatedPlan?.totalSpots,
    });
  }

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        join,
        status === JOIN_STATUS.APPROVED
          ? "Joined plan!"
          : "Join request sent — waiting for host approval"
      )
    );
});

//  PATCH /api/plans/:id/join/:joinId ─
const approveOrRejectJoin = asyncHandler(async (req, res) => {
  const { id: planId, joinId } = req.params;
  const { action } = req.body; // "approve" | "reject"

  if (!["approve", "reject"].includes(action)) {
    throw new ApiError(400, "Action must be 'approve' or 'reject'");
  }

  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  if (plan.hostedBy.toString() !== req.user!._id.toString()) {
    throw new ApiError(403, "Only the host can approve or reject join requests");
  }

  const join = await Join.findById(joinId);
  if (!join) throw new ApiError(404, "Join request not found");
  if (join.planId.toString() !== planId) throw new ApiError(400, "Join does not belong to this plan");

  if (join.status !== JOIN_STATUS.PENDING) {
    throw new ApiError(400, `This request is already ${join.status}`);
  }

  const newStatus = action === "approve" ? JOIN_STATUS.APPROVED : JOIN_STATUS.REJECTED;
  join.status = newStatus;
  await join.save();

  if (newStatus === JOIN_STATUS.APPROVED) {
    if (plan.joinedCount >= plan.totalSpots) {
      join.status = JOIN_STATUS.REJECTED;
      await join.save();
      throw new ApiError(403, "Plan is now full — cannot approve");
    }
    await Plan.findByIdAndUpdate(planId, { $inc: { joinedCount: 1 } });

    const updatedPlan = await Plan.findById(planId).select("joinedCount totalSpots");
    req.app.get("io")?.to(`plan_${planId}`).emit("plan_joined", {
      planId,
      joinedCount: updatedPlan?.joinedCount,
      totalSpots: updatedPlan?.totalSpots,
    });
  }

  return res.status(200).json(new ApiResponse(200, join, `Join request ${newStatus}`));
});

//  DELETE /api/plans/:id/leave ─
const leavePlan = asyncHandler(async (req, res) => {
  const { id: planId } = req.params;
  const userId = req.user!._id;

  const join = await Join.findOne({ planId, userId, status: JOIN_STATUS.APPROVED });
  if (!join) throw new ApiError(404, "You are not a member of this plan");

  await Join.findByIdAndDelete(join._id);
  await Plan.findByIdAndUpdate(planId, { $inc: { joinedCount: -1 } });

  const updatedPlan = await Plan.findById(planId).select("joinedCount totalSpots");
  req.app.get("io")?.to(`plan_${planId}`).emit("plan_joined", {
    planId,
    joinedCount: updatedPlan?.joinedCount,
    totalSpots: updatedPlan?.totalSpots,
  });

  return res.status(200).json(new ApiResponse(200, {}, "Left plan successfully"));
});

//  GET /api/plans/:id/members ──
const getPlanMembers = asyncHandler(async (req, res) => {
  const { id: planId } = req.params;

  const members = await Join.find({ planId, status: JOIN_STATUS.APPROVED })
    .populate("userId", "name avatar city")
    .sort({ createdAt: 1 });

  return res.status(200).json(new ApiResponse(200, members, "Members fetched"));
});

export { joinPlan, approveOrRejectJoin, leavePlan, getPlanMembers };

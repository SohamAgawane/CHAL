import mongoose from "mongoose";
import { Plan } from "../models/Plan.model.js";
import { Join } from "../models/Join.model.js";
import { Subscription } from "../models/Subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//  POST /api/plans 
const createPlan = asyncHandler(async (req, res) => {
  const {
    title,
    category,
    location,
    address,
    city,
    date,
    time,
    totalSpots,
    isOpen,
    description,
  } = req.body;

  if (
    !title?.trim() ||
    !category ||
    !location?.trim() ||
    !city?.trim() ||
    !date ||
    !time ||
    !totalSpots
  ) {
    throw new ApiError(400, "title, category, location, city, date, time, totalSpots are required");
  }

  const plan = await Plan.create({
    title: title.trim(),
    category,
    location: location.trim(),
    address: address?.trim() || "",
    city: city.trim().toLowerCase(),
    date: new Date(date),
    time,
    totalSpots: Number(totalSpots),
    isOpen: isOpen !== undefined ? isOpen : true,
    description: description?.trim() || "",
    hostedBy: req.user!._id,
    joinedCount: 1, // host is already in
  });

  // Notify subscribers for this city + category via socket (if io is available)
  const io = req.app.get("io");
  if (io) {
    const subscribers = await Subscription.find({
      city: city.trim().toLowerCase(),
      category,
    }).select("subscriber");

    subscribers.forEach((sub) => {
      io.to(`user_${sub.subscriber}`).emit("new_plan", {
        planId: plan._id,
        title: plan.title,
        city: plan.city,
        category: plan.category,
      });
    });
  }

  return res.status(201).json(new ApiResponse(201, plan, "Plan created successfully"));
});

//  GET /api/plans ─
const getPlans = asyncHandler(async (req, res) => {
  const { city, category, status, page = 1, limit = 10 } = req.query;
  const now = new Date();

  const matchStage: Record<string, unknown> = {};
  if (city) matchStage.city = String(city).toLowerCase().trim();
  if (category) matchStage.category = category;

  // Filter by computed plan status
  if (status === "upcoming") matchStage.date = { $gt: new Date(now.getTime() + 3600000) };
  else if (status === "completed") matchStage.date = { $lt: new Date(now.getTime() - 3600000) };
  else if (status === "ongoing") {
    matchStage.date = {
      $gte: new Date(now.getTime() - 3600000),
      $lte: new Date(now.getTime() + 3600000),
    };
  }

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const result = await Plan.aggregate([
    { $match: matchStage },
    {
      $facet: {
        data: [
          { $sort: { date: 1 } },
          { $skip: skip },
          { $limit: limitNum },
          {
            $lookup: {
              from: "users",
              localField: "hostedBy",
              foreignField: "_id",
              pipeline: [{ $project: { name: 1, avatar: 1 } }],
              as: "hostedBy",
            },
          },
          { $unwind: "$hostedBy" },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const plans = result[0].data;
  const total = result[0].totalCount[0]?.count || 0;

  return res.status(200).json(
    new ApiResponse(200, {
      plans,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  );
});

//  GET /api/plans/trending ─
const getTrendingPlans = asyncHandler(async (_req, res) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const plans = await Plan.aggregate([
    { $match: { date: { $gte: oneWeekAgo } } },
    { $sort: { joinedCount: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "hostedBy",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, avatar: 1 } }],
        as: "hostedBy",
      },
    },
    { $unwind: "$hostedBy" },
  ]);

  return res.status(200).json(new ApiResponse(200, plans, "Trending plans fetched"));
});

//  GET /api/plans/:id 
const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;

  const result = await Plan.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "users",
        localField: "hostedBy",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, avatar: 1, city: 1 } }],
        as: "hostedBy",
      },
    },
    { $unwind: "$hostedBy" },
    {
      $lookup: {
        from: "joins",
        let: { planId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $and: [{ $eq: ["$planId", "$$planId"] }, { $eq: ["$status", "approved"] }] },
            },
          },
          { $count: "count" },
        ],
        as: "memberCount",
      },
    },
    {
      $addFields: {
        memberCount: { $ifNull: [{ $arrayElemAt: ["$memberCount.count", 0] }, 0] },
      },
    },
  ]);

  if (!result.length) throw new ApiError(404, "Plan not found");

  // Check if current user has joined
  let hasJoined = false;
  if (userId) {
    const join = await Join.findOne({ planId: id, userId, status: "approved" });
    hasJoined = !!join;
  }

  const plan = { ...result[0], hasJoined };

  return res.status(200).json(new ApiResponse(200, plan, "Plan detail fetched"));
});

//  PATCH /api/plans/:id ─
const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plan = await Plan.findById(id);
  if (!plan) throw new ApiError(404, "Plan not found");

  if (plan.hostedBy.toString() !== req.user!._id.toString()) {
    throw new ApiError(403, "Only the host can update this plan");
  }

  const allowedFields = [
    "title",
    "location",
    "address",
    "date",
    "time",
    "totalSpots",
    "isOpen",
    "description",
  ] as const;
  const updates: Record<string, unknown> = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      updates[field] =
        typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
    }
  });

  if (updates.totalSpots && Number(updates.totalSpots) < plan.joinedCount) {
    throw new ApiError(400, `Cannot reduce spots below current joined count (${plan.joinedCount})`);
  }

  const updated = await Plan.findByIdAndUpdate(id, { $set: updates }, { new: true });

  return res.status(200).json(new ApiResponse(200, updated, "Plan updated"));
});

//  DELETE /api/plans/:id 
const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const plan = await Plan.findById(id);
  if (!plan) throw new ApiError(404, "Plan not found");

  const isHost = plan.hostedBy.toString() === req.user!._id.toString();
  const isAdmin = req.user!.isAdmin;

  if (!isHost && !isAdmin) {
    throw new ApiError(403, "Only the host or admin can delete this plan");
  }

  await Plan.findByIdAndDelete(id);
  await Join.deleteMany({ planId: id });

  return res.status(204).json(new ApiResponse(204, {}, "Plan deleted"));
});

//  GET /api/users/me/hosted 
const getMyHostedPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.aggregate([
    { $match: { hostedBy: req.user!._id } },
    {
      $lookup: {
        from: "joins",
        let: { planId: "$_id" },
        pipeline: [
          {
            $match: { $expr: { $and: [{ $eq: ["$planId", "$$planId"] }, { $eq: ["$status", "approved"] }] } },
          },
          { $count: "approvedCount" },
        ],
        as: "approvedMembers",
      },
    },
    {
      $addFields: {
        approvedMemberCount: { $ifNull: [{ $arrayElemAt: ["$approvedMembers.approvedCount", 0] }, 0] },
      },
    },
    { $project: { approvedMembers: 0 } },
    { $sort: { date: -1 } },
  ]);

  return res.status(200).json(new ApiResponse(200, plans, "Hosted plans fetched"));
});

//  GET /api/users/me/joined 
const getMyJoinedPlans = asyncHandler(async (req, res) => {
  const joins = await Join.aggregate([
    { $match: { userId: req.user!._id, status: "approved" } },
    {
      $lookup: {
        from: "plans",
        localField: "planId",
        foreignField: "_id",
        as: "plan",
      },
    },
    { $unwind: "$plan" },
    {
      $lookup: {
        from: "users",
        localField: "plan.hostedBy",
        foreignField: "_id",
        pipeline: [{ $project: { name: 1, avatar: 1 } }],
        as: "plan.hostedBy",
      },
    },
    { $unwind: "$plan.hostedBy" },
    { $sort: { "plan.date": -1 } },
    { $replaceRoot: { newRoot: "$plan" } },
  ]);

  return res.status(200).json(new ApiResponse(200, joins, "Joined plans fetched"));
});

export {
  createPlan,
  getPlans,
  getTrendingPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  getMyHostedPlans,
  getMyJoinedPlans,
};
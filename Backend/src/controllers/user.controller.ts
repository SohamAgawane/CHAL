import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";
import type { Types } from "mongoose";

//  Cookie Options ─
const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
};

//  Helper: generate both tokens and save refresh to DB 
const generateTokens = async (userId: Types.ObjectId | string) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

//  POST /api/users/register 
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, city } = req.body;

  if ([name, email, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) throw new ApiError(409, "Email is already registered");

  let avatar = "";
  let avatarPublicId = "";

  if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (uploaded) {
      avatar = uploaded.secure_url;
      avatarPublicId = uploaded.public_id;
    }
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    city: city?.trim() || "",
    avatar,
    avatarPublicId,
  });

  const created = await User.findById(user._id).select(
    "-password -refreshToken -avatarPublicId"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, created, "User registered successfully"));
});

//  POST /api/users/login 
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new ApiError(404, "User not found");

  const isValid = await user.isPasswordCorrect(password);
  if (!isValid) throw new ApiError(401, "Invalid credentials");

  const { accessToken, refreshToken } = await generateTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken -avatarPublicId"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: loggedInUser, accessToken }, "Logged in successfully")
    );
});

//  POST /api/users/logout ──
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user!._id, { $unset: { refreshToken: 1 } }, { new: true });

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});

//  POST /api/users/refresh-token ─
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized — no refresh token");

  let decoded: { _id: string };
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.JWT_SECRET as string) as {
      _id: string;
    };
  } catch {
    throw new ApiError(401, "Unauthorized — invalid refresh token");
  }

  const user = await User.findById(decoded._id);
  if (!user || user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is expired or already used");
  }

  const { accessToken, refreshToken } = await generateTokens(user._id);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, { accessToken }, "Access token refreshed"));
});

//  GET /api/users/me ─
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User profile fetched"));
});

//  PATCH /api/users/me ──
const updateProfile = asyncHandler(async (req, res) => {
  const { name, city } = req.body;

  if (!name?.trim() && !city?.trim()) {
    throw new ApiError(400, "Provide at least one field to update");
  }

  const updateFields: Record<string, string> = {};
  if (name?.trim()) updateFields.name = name.trim();
  if (city?.trim()) updateFields.city = city.trim();

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: updateFields },
    { new: true }
  ).select("-password -refreshToken -avatarPublicId");

  return res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

//  PATCH /api/users/me/avatar ──
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file?.path) throw new ApiError(400, "Avatar file is required");

  // Delete old avatar from Cloudinary
  const currentUser = await User.findById(req.user!._id);
  if (currentUser?.avatarPublicId) {
    await deleteFromCloudinary(currentUser.avatarPublicId);
  }

  const uploaded = await uploadOnCloudinary(req.file.path);
  if (!uploaded) throw new ApiError(500, "Failed to upload avatar");

  const user = await User.findByIdAndUpdate(
    req.user!._id,
    { $set: { avatar: uploaded.secure_url, avatarPublicId: uploaded.public_id } },
    { new: true }
  ).select("-password -refreshToken -avatarPublicId");

  return res.status(200).json(new ApiResponse(200, user, "Avatar updated"));
});

//  PATCH /api/users/me/password 
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required");
  }

  const user = await User.findById(req.user!._id);
  if (!user) throw new ApiError(404, "User not found");

  const isValid = await user.isPasswordCorrect(currentPassword);
  if (!isValid) throw new ApiError(401, "Current password is incorrect");

  if (newPassword.length < 6)
    throw new ApiError(400, "New password must be at least 6 characters");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

//  GET /api/users/me/activity ──
const getUserActivity = asyncHandler(async (req, res) => {
  const { Join } = await import("../models/Join.model.js");
  const { Plan } = await import("../models/Plan.model.js");
  const now = new Date();

  // Plans hosted
  const hosted = await Plan.find({ hostedBy: req.user!._id })
    .select("title category date city joinedCount totalSpots")
    .sort({ date: -1 });

  // Plans joined (via approved Join docs)
  const joins = await Join.find({ userId: req.user!._id, status: "approved" })
    .populate({
      path: "planId",
      select: "title category date city joinedCount totalSpots hostedBy",
      populate: { path: "hostedBy", select: "name avatar" },
    })
    .sort({ createdAt: -1 });

  const computeStatus = (date: Date) => {
    const planDate = new Date(date);
    const diff = planDate.getTime() - now.getTime();
    if (diff > 3600000) return "upcoming";
    if (diff > -3600000) return "ongoing";
    return "completed";
  };

  const hostedWithStatus = hosted.map((p) => ({
    ...p.toObject(),
    planStatus: computeStatus(p.date),
  }));

  const joinedWithStatus = joins
    .filter((j) => j.planId)
    .map((j) => {
      // planId is populated, so cast through unknown to access plan fields
      const plan = j.planId as unknown as {
        toObject: () => Record<string, unknown>;
        date: Date;
      };
      return {
        ...plan.toObject(),
        planStatus: computeStatus(plan.date),
        joinedAt: j.createdAt,
      };
    });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { hosted: hostedWithStatus, joined: joinedWithStatus },
        "Activity fetched"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  updateAvatar,
  changePassword,
  getUserActivity,
};

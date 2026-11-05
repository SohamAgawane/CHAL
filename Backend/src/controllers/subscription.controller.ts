import { Subscription } from "../models/Subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

interface MongoDuplicateKeyError {
  code?: number;
}

//  POST /api/subscribe ──
const subscribe = asyncHandler(async (req, res) => {
  const { city, category } = req.body;

  if (!city?.trim() || !category) {
    throw new ApiError(400, "city and category are required");
  }

  let sub;
  try {
    sub = await Subscription.create({
      subscriber: req.user!._id,
      city: city.trim().toLowerCase(),
      category,
    });
  } catch (err) {
    if ((err as MongoDuplicateKeyError).code === 11000) {
      throw new ApiError(409, "Already subscribed to this city + category");
    }
    throw err;
  }

  return res.status(201).json(new ApiResponse(201, sub, "Subscribed successfully"));
});

//  GET /api/subscribe/me 
const getMySubscriptions = asyncHandler(async (req, res) => {
  const subs = await Subscription.find({ subscriber: req.user!._id }).sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, subs, "Subscriptions fetched"));
});

//  DELETE /api/subscribe/:id 
const unsubscribe = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sub = await Subscription.findById(id);
  if (!sub) throw new ApiError(404, "Subscription not found");

  if (sub.subscriber.toString() !== req.user!._id.toString()) {
    throw new ApiError(403, "You can only delete your own subscriptions");
  }

  await Subscription.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, {}, "Unsubscribed successfully"));
});

export { subscribe, getMySubscriptions, unsubscribe };

import { Message } from "../models/Message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//  POST /api/plans/:id/messages 
const sendMessage = asyncHandler(async (req, res) => {
  const { id: planId } = req.params;
  const { text } = req.body;

  if (!text?.trim()) throw new ApiError(400, "Message text is required");

  const message = await Message.create({
    planId,
    senderId: req.user!._id,
    text: text.trim(),
  });

  const populated = await Message.findById(message._id).populate("senderId", "name avatar");

  // Emit to plan room
  req.app.get("io")?.to(`plan_${planId}`).emit("new_message", populated);

  return res.status(201).json(new ApiResponse(201, populated, "Message sent"));
});

//  GET /api/plans/:id/messages ─
const getMessages = asyncHandler(async (req, res) => {
  const { id: planId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const pageNum = Number(page);
  const limitNum = Number(limit);
  const skip = (pageNum - 1) * limitNum;

  const [messages, total] = await Promise.all([
    Message.find({ planId })
      .populate("senderId", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Message.countDocuments({ planId }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      messages: messages.reverse(), // oldest first
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  );
});

export { sendMessage, getMessages };

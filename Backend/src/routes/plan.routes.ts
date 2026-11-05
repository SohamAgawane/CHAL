import { Router } from "express";
import {
  createPlan,
  getPlans,
  getTrendingPlans,
  getPlanById,
  updatePlan,
  deletePlan,
} from "../controllers/plan.controller.js";
import {
  joinPlan,
  approveOrRejectJoin,
  leavePlan,
  getPlanMembers,
} from "../controllers/join.controller.js";
import { sendMessage, getMessages } from "../controllers/message.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { checkIsMember } from "../middlewares/member.middleware.js";

const router = Router();

// Public plan reads (auth optional for hasJoined field)
router.get("/", getPlans);
router.get("/trending", getTrendingPlans);
router.get("/:id", verifyJWT, getPlanById);

// Protected plan mutations
router.post("/", verifyJWT, createPlan);
router.patch("/:id", verifyJWT, updatePlan);
router.delete("/:id", verifyJWT, deletePlan);

// Join flow
router.post("/:id/join", verifyJWT, joinPlan);
router.patch("/:id/join/:joinId", verifyJWT, approveOrRejectJoin);
router.delete("/:id/leave", verifyJWT, leavePlan);
router.get("/:id/members", verifyJWT, getPlanMembers);

// Group chat (member-only)
router.post("/:id/messages", verifyJWT, checkIsMember, sendMessage);
router.get("/:id/messages", verifyJWT, checkIsMember, getMessages);

export default router;

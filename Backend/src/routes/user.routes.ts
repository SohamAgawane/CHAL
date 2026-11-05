import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  updateProfile,
  updateAvatar,
  changePassword,
  getUserActivity,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { getMyHostedPlans, getMyJoinedPlans } from "../controllers/plan.controller.js";

const router = Router();

// Public
router.post("/register", upload.single("avatar"), registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Protected
router.use(verifyJWT); // All routes below require auth

router.post("/logout", logoutUser);
router.get("/me", getCurrentUser);
router.patch("/me", updateProfile);
router.patch("/me/avatar", upload.single("avatar"), updateAvatar);
router.patch("/me/password", changePassword);
router.get("/me/activity", getUserActivity);
router.get("/me/hosted", getMyHostedPlans);
router.get("/me/joined", getMyJoinedPlans);

export default router;

import { Router } from "express";
import {
  subscribe,
  getMySubscriptions,
  unsubscribe,
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", subscribe);
router.get("/me", getMySubscriptions);
router.delete("/:id", unsubscribe);

export default router;

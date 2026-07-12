import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { chatRateLimit } from "../middleware/rate-limit.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  postMessages,
  getConversations,
  getConversation,
  approveAction,
  rejectAction,
} from "../controllers/chat.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/conversations", asyncHandler(getConversations));
router.get("/conversations/:id", asyncHandler(getConversation));
router.post("/messages", chatRateLimit, asyncHandler(postMessages));
router.post("/actions/:id/approve", asyncHandler(approveAction));
router.post("/actions/:id/reject", asyncHandler(rejectAction));

export default router;

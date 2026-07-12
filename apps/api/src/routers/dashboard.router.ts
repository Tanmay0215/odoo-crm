import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import { getDashboardSummaryHandler } from "../controllers/dashboard.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/summary", asyncHandler(getDashboardSummaryHandler));

export default router;

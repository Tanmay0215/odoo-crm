import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import * as dashboardController from "../controllers/dashboard.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/summary", asyncHandler(dashboardController.getDashboardSummary));

export default router;

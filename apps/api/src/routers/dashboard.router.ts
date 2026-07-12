import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  getDashboardSummaryHandler,
  getReportsSummaryHandler,
  getReportsCSVHandler,
} from "../controllers/dashboard.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/summary", asyncHandler(getDashboardSummaryHandler));
router.get("/reports", asyncHandler(getReportsSummaryHandler));
router.get("/reports/csv", asyncHandler(getReportsCSVHandler));

export default router;

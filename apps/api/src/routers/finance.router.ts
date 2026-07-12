import { Router } from "express";
import {
  getFuelLogs,
  getExpenses,
  postFuelLog,
  postExpense,
  getOperationalCost,
} from "../controllers/finance.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router: Router = Router();

router.get("/fuel", authenticateJWT, asyncHandler(getFuelLogs));
router.get("/expenses", authenticateJWT, asyncHandler(getExpenses));
router.post("/fuel", authenticateJWT, asyncHandler(postFuelLog));
router.post("/expenses", authenticateJWT, asyncHandler(postExpense));
router.get(
  "/cost/:vehicleId",
  authenticateJWT,
  asyncHandler(getOperationalCost),
);

export default router;

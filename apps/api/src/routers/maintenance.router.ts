import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  listMaintenanceLogsHandler,
  getMaintenanceLogHandler,
  createMaintenanceLogHandler,
  updateMaintenanceLogHandler,
} from "../controllers/maintenance.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/", asyncHandler(listMaintenanceLogsHandler));
router.get("/:id", asyncHandler(getMaintenanceLogHandler));

router.post(
  "/",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(createMaintenanceLogHandler),
);
router.put(
  "/:id",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(updateMaintenanceLogHandler),
);

export default router;

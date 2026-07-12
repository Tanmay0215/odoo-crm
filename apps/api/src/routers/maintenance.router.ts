import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import * as maintenanceController from "../controllers/maintenance.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/", asyncHandler(maintenanceController.listMaintenanceLogs));
router.get("/:id", asyncHandler(maintenanceController.getMaintenanceLog));

router.post(
  "/",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(maintenanceController.createMaintenanceLog),
);
router.put(
  "/:id",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(maintenanceController.updateMaintenanceLog),
);

export default router;

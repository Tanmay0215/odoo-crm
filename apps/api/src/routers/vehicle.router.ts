import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import * as vehicleController from "../controllers/vehicle.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/", asyncHandler(vehicleController.listVehicles));
router.get("/available", asyncHandler(vehicleController.listAvailableVehicles));
router.get("/status-counts", asyncHandler(vehicleController.getVehicleStatusCounts));
router.get("/:id", asyncHandler(vehicleController.getVehicle));

router.post(
  "/",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(vehicleController.createVehicle),
);
router.put(
  "/:id",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(vehicleController.updateVehicle),
);
router.delete(
  "/:id",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(vehicleController.deleteVehicle),
);

export default router;

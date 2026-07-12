import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  listVehiclesHandler,
  listAvailableVehiclesHandler,
  getVehicleStatusCountsHandler,
  getVehicleHandler,
  createVehicleHandler,
  updateVehicleHandler,
  deleteVehicleHandler,
} from "../controllers/vehicle.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/", asyncHandler(listVehiclesHandler));
router.get("/available", asyncHandler(listAvailableVehiclesHandler));
router.get("/status-counts", asyncHandler(getVehicleStatusCountsHandler));
router.get("/:id", asyncHandler(getVehicleHandler));

router.post(
  "/",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(createVehicleHandler),
);
router.put(
  "/:id",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(updateVehicleHandler),
);
router.delete(
  "/:id",
  requireRole(["FLEET_MANAGER"]),
  asyncHandler(deleteVehicleHandler),
);

export default router;

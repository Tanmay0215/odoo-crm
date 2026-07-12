import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import * as driverController from "../controllers/driver.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/", asyncHandler(driverController.listDrivers));
router.get("/available", asyncHandler(driverController.listAvailableDrivers));
router.get("/:id", asyncHandler(driverController.getDriver));

router.post(
  "/",
  requireRole(["SAFETY_OFFICER"]),
  asyncHandler(driverController.createDriver),
);
router.put(
  "/:id",
  requireRole(["SAFETY_OFFICER"]),
  asyncHandler(driverController.updateDriver),
);
router.delete(
  "/:id",
  requireRole(["SAFETY_OFFICER"]),
  asyncHandler(driverController.deleteDriver),
);

export default router;

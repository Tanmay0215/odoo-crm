import { Router } from "express";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  listDriversHandler,
  listAvailableDriversHandler,
  getDriverHandler,
  createDriverHandler,
  updateDriverHandler,
  deleteDriverHandler,
} from "../controllers/driver.controller.js";

const router: Router = Router();

router.use(authenticateJWT);

router.get("/", asyncHandler(listDriversHandler));
router.get("/available", asyncHandler(listAvailableDriversHandler));
router.get("/:id", asyncHandler(getDriverHandler));

router.post(
  "/",
  requireRole(["SAFETY_OFFICER"]),
  asyncHandler(createDriverHandler),
);
router.put(
  "/:id",
  requireRole(["SAFETY_OFFICER"]),
  asyncHandler(updateDriverHandler),
);
router.delete(
  "/:id",
  requireRole(["SAFETY_OFFICER"]),
  asyncHandler(deleteDriverHandler),
);

export default router;

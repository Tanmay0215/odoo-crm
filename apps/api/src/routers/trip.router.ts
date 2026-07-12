import { Router } from "express";
import {
  getTrips,
  getTrip,
  postTrip,
  postDispatch,
  postComplete,
  postCancel,
} from "../controllers/trip.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router: Router = Router();

router.get("/", authenticateJWT, asyncHandler(getTrips));
router.get("/:id", authenticateJWT, asyncHandler(getTrip));
router.post("/", authenticateJWT, asyncHandler(postTrip));
router.post("/:id/dispatch", authenticateJWT, asyncHandler(postDispatch));
router.post("/:id/complete", authenticateJWT, asyncHandler(postComplete));
router.post("/:id/cancel", authenticateJWT, asyncHandler(postCancel));

export default router;

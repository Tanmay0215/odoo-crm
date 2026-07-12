import { Router } from "express";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { authenticateJWT } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/async-handler.js";

const router: Router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", authenticateJWT, asyncHandler(getMe));

export default router;

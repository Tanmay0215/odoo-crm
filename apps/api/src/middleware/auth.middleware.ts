import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../utils/app-error.js";
import { env } from "../config/env.config.js";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "FLEET_MANAGER" | "DRIVER" | "SAFETY_OFFICER" | "FINANCIAL_ANALYST";
  };
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authorization header is missing or malformed");
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    throw new UnauthorizedError("Access token not found in headers");
  }

  try {
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET,
    ) as AuthenticatedRequest["user"];
    req.user = decoded;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired session token");
  }
};

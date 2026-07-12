import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth.middleware.js";
import { TooManyRequestsError } from "../utils/app-error.js";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

const requestLog = new Map<string, number[]>();

/** Simple in-memory sliding-window limiter, keyed per authenticated user. Cost/abuse control for chat/LLM endpoints. */
export const chatRateLimit = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;
  if (!userId) {
    return next();
  }

  const now = Date.now();
  const timestamps = (requestLog.get(userId) ?? []).filter(
    (ts) => now - ts < WINDOW_MS,
  );

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    throw new TooManyRequestsError(
      "Chat rate limit exceeded. Please wait a few minutes before trying again.",
    );
  }

  timestamps.push(now);
  requestLog.set(userId, timestamps);
  next();
};

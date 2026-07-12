import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service.js";

export const getDashboardSummary = async (_req: Request, res: Response) => {
  const summary = await dashboardService.getDashboardSummary();
  res.json({ success: true, data: summary });
};

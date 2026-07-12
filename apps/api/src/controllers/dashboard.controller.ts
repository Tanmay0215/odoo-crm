import { Request, Response } from "express";
import {
  getDashboardSummary,
  getReportsSummary,
  generateReportsCSV,
} from "../services/dashboard.service.js";

export const getDashboardSummaryHandler = async (
  _req: Request,
  res: Response,
) => {
  const summary = await getDashboardSummary();
  res.json({ success: true, data: summary });
};

export const getReportsSummaryHandler = async (
  _req: Request,
  res: Response,
) => {
  const reports = await getReportsSummary();
  res.json({ success: true, data: reports });
};

export const getReportsCSVHandler = async (_req: Request, res: Response) => {
  const csv = await generateReportsCSV();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=transitops_report.csv",
  );
  res.status(200).send(csv);
};

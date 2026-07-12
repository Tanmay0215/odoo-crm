"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { financesClient } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function AnalyticsPage() {
  const { user, token } = useAuthStore();

  const {
    data: reports = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["reports"],
    queryFn: () => financesClient.getReports(),
  });

  const handleDownloadCSV = async () => {
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${apiUrl}/dashboard/reports/csv`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download report: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "transitops_report.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Could not download CSV. Please verify authentication.");
    }
  };

  const handleDownloadPDF = async () => {
    // @ts-expect-error - jspdf/dist/jspdf.es.min.js has no declaration file
    const jsPDF = (await import("jspdf/dist/jspdf.es.min.js")).default;
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF();

    // 1. Title Header Block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("TransitOps", 14, 20);

    doc.setFontSize(11);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text("Smart Transport Operations • Fleet Analytics Ledger", 14, 26);

    // Metadata lines
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
    doc.text(
      `Exported By: ${user?.name || "Anonymous"} (${user?.role || "FINANCIAL_ANALYST"})`,
      14,
      39,
    );

    doc.setDrawColor(226, 232, 240); // slate-200 line separator
    doc.line(14, 43, 196, 43);

    // 2. High-level Summary Section
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Financial Summary Indices", 14, 52);

    autoTable(doc, {
      startY: 56,
      head: [["Performance Indicator", "Current Outlay Value (₹)"]],
      body: [
        [
          "Total Fleet Revenue Stream",
          `₹${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
        [
          "Total Operational Costs (Fuel & Repairs)",
          `₹${totalCosts.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
        [
          "Net Consolidated Profitability",
          `₹${totalProfitability.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [79, 70, 229] }, // Premium Indigo fill
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3.5 },
    });

    // 3. Vehicles detailed ledger break-up
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(
      "Vehicle Return on Investment (ROI) Ledger",
      14,
      (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
        .finalY + 12,
    );

    const vehicleRows = reports.map((r) => [
      r.registrationNumber,
      r.name,
      `₹${Number(r.revenue).toLocaleString()}`,
      `₹${Number(r.fuelCost).toLocaleString()}`,
      `₹${Number(r.maintenanceCost).toLocaleString()}`,
      `₹${Number(r.totalOperationalCost).toLocaleString()}`,
      `${Number(r.roi).toFixed(1)}%`,
    ]);

    autoTable(doc, {
      startY:
        (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
          .finalY + 16,
      head: [
        [
          "Reg No",
          "Model Name",
          "Revenue",
          "Fuel Costs",
          "Maint. Costs",
          "Total Cost",
          "ROI",
        ],
      ],
      body: vehicleRows,
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42] }, // Classic Dark Slate table header
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 3 },
      columnStyles: {
        6: { fontStyle: "bold", textColor: [16, 185, 129] }, // Color code the ROI percentage in green
      },
    });

    // 4. Footer Section
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: "right" });
      doc.text("Confidential - TransitOps Smart Analytics Platform", 14, 285);
    }

    // Save and download the document
    doc.save(
      `TransitOps_Performance_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
    );
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cumulative totals
  const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0);
  const totalCosts = reports.reduce(
    (sum, r) => sum + r.totalOperationalCost,
    0,
  );
  const totalProfitability = totalRevenue - totalCosts;

  // Chart data calculations
  const barChartData = reports.map((r) => ({
    name: r.registrationNumber,
    fullName: `${r.name} ${r.model}`,
    Revenue: Number(r.revenue),
    Cost: Number(r.totalOperationalCost),
  }));

  const efficiencyChartData = reports.map((r) => ({
    name: r.registrationNumber,
    fullName: `${r.name} ${r.model}`,
    "Efficiency (km/L)": Number(r.fuelEfficiency),
  }));

  const totalFuel = reports.reduce((sum, r) => sum + r.fuelCost, 0);
  const totalMaint = reports.reduce((sum, r) => sum + r.maintenanceCost, 0);
  const totalExp = reports.reduce((sum, r) => sum + r.generalExpenseCost, 0);

  const expenseBreakdown = [
    { name: "Fuel Cost", value: totalFuel, color: "#f59e0b" },
    { name: "Maintenance", value: totalMaint, color: "#ef4444" },
    { name: "General Fees", value: totalExp, color: "#64748b" },
  ].filter((item) => item.value > 0);

  return (
    <AppShell title="Reports & Analytics">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-extrabold tracking-wide uppercase">
            Asset Profitability & Resource Analytics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadCSV}
            disabled={isLoading || reports.length === 0}
            className="h-10 px-5 bg-white/50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export CSV Spreadsheet
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isLoading || reports.length === 0}
            className="h-10 px-5 bg-primary hover:bg-primary/95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export Tabular PDF
          </button>
        </div>
      </div>

      {/* Main KPI summary panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-6 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Cumulative Fleet Revenue
          </span>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
            ₹
            {totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div className="glass-panel p-6 flex flex-col justify-between">
          <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Total Operational Outlays
          </span>
          <div className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-2 font-mono">
            ₹
            {totalCosts.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
        <div
          className={`glass-panel p-6 flex flex-col justify-between border
          ${totalProfitability >= 0 ? "bg-emerald-500/5 border-emerald-500/20" : "bg-rose-500/5 border-rose-500/20"}`}
        >
          <span
            className={`text-[10px] font-extrabold uppercase tracking-widest ${totalProfitability >= 0 ? "text-emerald-500" : "text-rose-500"}`}
          >
            Net Operating surplus
          </span>
          <div
            className={`text-2xl font-black mt-2 font-mono ${totalProfitability >= 0 ? "text-emerald-500" : "text-rose-500"}`}
          >
            ₹
            {totalProfitability.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* --- COMPARATIVE COST VS REVENUE BAR GRAPH --- */}
        <div className="glass-panel p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Costs vs Revenue Profiles
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Side-by-side asset comparison (₹)
            </p>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {!isLoading && !isError && barChartData.length === 0 && (
              <span className="text-xs text-slate-400 font-bold">No active data to plot</span>
            )}
            {isLoading && <span className="text-xs text-slate-400 font-bold">Loading...</span>}
            {isError && <span className="text-xs text-rose-500 font-bold">Failed to load</span>}
            {!isLoading && !isError && barChartData.length > 0 && mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      color: "#f8fafc",
                    }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10, fontWeight: "bold" }} />
                  <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Cost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- FUEL MILEAGE EFFICIENCY PLOT --- */}
        <div className="glass-panel p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Fuel Mileage Efficiency
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Kilometers driven per liter of fuel (km/L)
            </p>
          </div>

          <div className="h-[280px] w-full flex items-center justify-center">
            {!isLoading && !isError && efficiencyChartData.length === 0 && (
              <span className="text-xs text-slate-400 font-bold">No active data to plot</span>
            )}
            {isLoading && <span className="text-xs text-slate-400 font-bold">Loading...</span>}
            {isError && <span className="text-xs text-rose-500 font-bold">Failed to load</span>}
            {!isLoading && !isError && efficiencyChartData.length > 0 && mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      color: "#f8fafc",
                    }}
                  />
                  <Bar dataKey="Efficiency (km/L)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- FLEET EXPENSES BREAKDOWN PIE CHART --- */}
        <div className="glass-panel p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Fleet Expense Distribution
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
              Total operational outlay breakdown
            </p>
          </div>

          <div className="h-[220px] w-full flex items-center justify-center relative">
            {!isLoading && !isError && expenseBreakdown.length === 0 && (
              <span className="text-xs text-slate-400 font-bold">No active expenses recorded</span>
            )}
            {isLoading && <span className="text-xs text-slate-400 font-bold">Loading...</span>}
            {isError && <span className="text-xs text-rose-500 font-bold">Failed to load</span>}
            {!isLoading && !isError && expenseBreakdown.length > 0 && mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {expenseBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      color: "#f8fafc",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {!isLoading && !isError && expenseBreakdown.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase tracking-wider">
              {expenseBreakdown.map((item) => (
                <div key={item.name} className="flex flex-col items-center">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                  </span>
                  <span className="text-slate-800 dark:text-slate-200 mt-0.5 font-mono">
                    ₹{item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- ASSET ROI LEADERBOARD --- */}
      <div className="glass-panel overflow-hidden">
        <h2 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-6 py-5 border-b border-slate-100/50 dark:border-slate-900/30 bg-white/25 dark:bg-slate-950/15">
          Vehicle ROI Leaderboard
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-900 text-left text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-extrabold bg-slate-50/40 dark:bg-slate-950/15">
                <th className="px-5 py-4.5">Registration</th>
                <th className="px-5 py-4.5">Vehicle Details</th>
                <th className="px-5 py-4.5">Odometer</th>
                <th className="px-5 py-4.5">Total Revenue</th>
                <th className="px-5 py-4.5">Fuel Outlay</th>
                <th className="px-5 py-4.5">Maintenance Cost</th>
                <th className="px-5 py-4.5 text-right font-black">ROI (%)</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                  >
                    Compiling leaderboard...
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-rose-500 font-bold leading-relaxed"
                  >
                    Failed to compile leaderboard.
                  </td>
                </tr>
              )}
              {!isLoading && !isError && reports.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-slate-400 dark:text-slate-500 font-bold leading-relaxed"
                  >
                    No active assets to rank.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-slate-100/50 dark:border-slate-900/30 last:border-0 hover:bg-white/20 dark:hover:bg-slate-900/10 transition-colors"
                >
                  <td className="px-5 py-4 text-slate-800 dark:text-slate-200 font-black font-mono">
                    {r.registrationNumber}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-bold">
                    {r.name} {r.model} ({r.type})
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono font-bold">
                    {r.odometer.toLocaleString()} km
                  </td>
                  <td className="px-5 py-4 text-blue-500 font-extrabold font-mono">
                    ₹{r.revenue.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold font-mono">
                    ₹{r.fuelCost.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-bold font-mono">
                    ₹{r.maintenanceCost.toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider border
                      ${r.roi >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"}`}
                    >
                      {r.roi >= 0 ? `+${r.roi}%` : `${r.roi}%`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

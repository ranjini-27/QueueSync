import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { getTodayReportData } from "../services/adminService.js";
import { sendError } from "../utils/apiResponse.js";

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/** GET /api/admin/reports/today?format=pdf|excel — defaults to pdf. */
export async function downloadTodayReport(req, res) {
  try {
    const format = (req.query.format || "pdf").toLowerCase();
    const report = await getTodayReportData();

    if (format === "excel" || format === "xlsx") {
      return sendExcelReport(res, report);
    }
    return sendPdfReport(res, report);
  } catch (err) {
    return sendError(res, 500, "Could not generate the report.", err.message);
  }
}

/** Streams a one-page PDF summary: totals, then a simple per-counter table. */
function sendPdfReport(res, report) {
  const filename = `queue-report-${formatDate(report.date)}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fillColor("#0B2545").fontSize(18).text("Meridian Trust Bank — Daily Queue Report");
  doc.moveDown(0.2);
  doc
    .fontSize(10)
    .fillColor("#6B7785")
    .text(`Date: ${formatDate(report.date)}   ·   Generated: ${report.generatedAt.toLocaleString()}`);
  doc.moveDown(1.2);

  doc.fillColor("#0B2545").fontSize(13).text("Summary");
  doc.moveDown(0.4);
  doc.fontSize(11).fillColor("#0B2545");
  const t = report.totals;
  [
    ["Tokens Issued", t.tokensIssued],
    ["Completed", t.completed],
    ["Skipped", t.skipped],
    ["Still Waiting", t.waitingCount],
    ["Active Counters", t.activeCounters],
    ["Staff Online", t.staffOnline],
  ].forEach(([label, value]) => doc.text(`${label}: ${value}`));

  doc.moveDown(1.2);
  doc.fontSize(13).text("By Counter");
  doc.moveDown(0.5);

  const colX = [50, 155, 250, 330, 415, 490];
  const headerY = doc.y;
  doc.fontSize(9).fillColor("#6B7785");
  doc.text("Counter", colX[0], headerY, { width: 100 });
  doc.text("Status", colX[1], headerY, { width: 85 });
  doc.text("Issued", colX[2], headerY, { width: 75 });
  doc.text("Completed", colX[3], headerY, { width: 80 });
  doc.text("Skipped", colX[4], headerY, { width: 70 });
  doc.text("Avg Wait", colX[5], headerY, { width: 70 });
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(560, doc.y).strokeColor("#E8F1FB").stroke();
  doc.moveDown(0.4);

  doc.fillColor("#0B2545").fontSize(10);
  report.counters.forEach((c) => {
    const rowY = doc.y;
    doc.text(c.name, colX[0], rowY, { width: 100 });
    doc.text(c.status, colX[1], rowY, { width: 85 });
    doc.text(String(c.todayCustomers), colX[2], rowY, { width: 75 });
    doc.text(String(c.completed), colX[3], rowY, { width: 80 });
    doc.text(String(c.skipped), colX[4], rowY, { width: 70 });
    doc.text(`${c.averageWaitMinutes} min`, colX[5], rowY, { width: 70 });
    doc.moveDown(0.5);
  });

  doc.end();
}

/** Streams an .xlsx workbook: a Summary sheet and a By Counter sheet. */
async function sendExcelReport(res, report) {
  const filename = `queue-report-${formatDate(report.date)}.xlsx`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart Bank Queue — Admin Dashboard";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Metric", key: "metric", width: 24 },
    { header: "Value", key: "value", width: 16 },
  ];
  summarySheet.addRows([
    { metric: "Date", value: formatDate(report.date) },
    { metric: "Tokens Issued", value: report.totals.tokensIssued },
    { metric: "Completed", value: report.totals.completed },
    { metric: "Skipped", value: report.totals.skipped },
    { metric: "Still Waiting", value: report.totals.waitingCount },
    { metric: "Active Counters", value: report.totals.activeCounters },
    { metric: "Staff Online", value: report.totals.staffOnline },
  ]);
  summarySheet.getRow(1).font = { bold: true };

  const counterSheet = workbook.addWorksheet("By Counter");
  counterSheet.columns = [
    { header: "Counter", key: "name", width: 16 },
    { header: "Status", key: "status", width: 12 },
    { header: "Tokens Issued", key: "todayCustomers", width: 16 },
    { header: "Completed", key: "completed", width: 14 },
    { header: "Skipped", key: "skipped", width: 12 },
    { header: "Still Waiting", key: "waitingCount", width: 14 },
    { header: "Avg Wait (min)", key: "averageWaitMinutes", width: 16 },
  ];
  counterSheet.addRows(report.counters);
  counterSheet.getRow(1).font = { bold: true };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
}

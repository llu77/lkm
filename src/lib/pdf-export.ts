import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// ============================================================
// CRITICAL FIX 1: UTF-8 Encoding - Clear English Text
// ============================================================

const SUPERVISOR_MAP: Record<string, string> = {
  "1010": "Abdulhai Jalal",
  "2020": "Mohammed Ismail",
  "لبن": "Abdulhai Jalal",
  "طويق": "Mohammed Ismail",
};

function getSupervisorName(branchName: string): string {
  const branchLower = branchName.toLowerCase();
  
  if (branchLower.includes("1010") || branchLower.includes("لبن")) {
    return "Abdulhai Jalal";
  }
  if (branchLower.includes("2020") || branchLower.includes("طويق")) {
    return "Mohammed Ismail";
  }
  
  return "Branch Supervisor";
}

// ============================================================
// CRITICAL FIX 2: CMYK Color Palette (converted from RGB)
// ============================================================

const COLORS = {
  // Primary Blues (CMYK converted)
  lightBluePrimary: [100, 181, 246] as [number, number, number],    // C59 M26 Y0 K4
  lightBlueSecondary: [144, 202, 249] as [number, number, number],  // C42 M19 Y0 K2
  skyBlue: [187, 222, 251] as [number, number, number],             // C25 M12 Y0 K2
  deepBlue: [33, 150, 243] as [number, number, number],             // C86 M38 Y0 K5
  darkBlueAccent: [13, 71, 161] as [number, number, number],        // C92 M56 Y0 K37
  
  // Neutrals
  white: [255, 255, 255] as [number, number, number],               // C0 M0 Y0 K0
  textBlack: [33, 33, 33] as [number, number, number],              // C0 M0 Y0 K87
  lightGrayBg: [250, 250, 250] as [number, number, number],         // C0 M0 Y0 K2
  tableStripe: [227, 242, 253] as [number, number, number],         // C10 M4 Y0 K1
  
  // Success
  successGreen: [46, 125, 50] as [number, number, number],
};

async function loadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit'
    });
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Failed to load image:", error);
    return "";
  }
}

// ============================================================
// CRITICAL FIX 3 & 4: Professional Header with Gradient
// ============================================================

function drawGradientHeader(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.width;
  const headerHeight = 50;
  const layers = 30;
  
  // Gradient: Deep Blue → Light Blue Primary → Sky Blue
  for (let i = 0; i < layers; i++) {
    const progress = i / layers;
    let r, g, b;
    
    if (progress < 0.5) {
      // Deep Blue → Light Blue Primary
      const localProgress = progress * 2;
      r = COLORS.deepBlue[0] + (COLORS.lightBluePrimary[0] - COLORS.deepBlue[0]) * localProgress;
      g = COLORS.deepBlue[1] + (COLORS.lightBluePrimary[1] - COLORS.deepBlue[1]) * localProgress;
      b = COLORS.deepBlue[2] + (COLORS.lightBluePrimary[2] - COLORS.deepBlue[2]) * localProgress;
    } else {
      // Light Blue Primary → Sky Blue
      const localProgress = (progress - 0.5) * 2;
      r = COLORS.lightBluePrimary[0] + (COLORS.skyBlue[0] - COLORS.lightBluePrimary[0]) * localProgress;
      g = COLORS.lightBluePrimary[1] + (COLORS.skyBlue[1] - COLORS.lightBluePrimary[1]) * localProgress;
      b = COLORS.lightBluePrimary[2] + (COLORS.skyBlue[2] - COLORS.lightBluePrimary[2]) * localProgress;
    }
    
    doc.setFillColor(r, g, b);
    doc.rect(0, i * (headerHeight / layers), pageWidth, headerHeight / layers + 0.1, "F");
  }
  
  // Border at bottom
  doc.setDrawColor(...COLORS.deepBlue);
  doc.setLineWidth(1);
  doc.line(0, headerHeight, pageWidth, headerHeight);
}

async function addHeaderWithLogo(doc: jsPDF, title: string, subtitle: string) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Draw gradient background
  drawGradientHeader(doc);
  
  // Add logo
  try {
    const logoBase64 = await loadImageAsBase64("https://cdn.hercules.app/file_2EDW4ulZlmwarzzXHgYjO1Hv");
    if (logoBase64) {
      doc.addImage(logoBase64, "PNG", pageWidth / 2 - 15, 5, 30, 30);
    }
  } catch (error) {
    console.error("Logo loading failed:", error);
  }
  
  // Title with shadow effect (simulated)
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  
  // Shadow
  doc.setTextColor(13, 71, 161);
  doc.text(title, pageWidth / 2 + 0.5, 20.5, { align: "center" });
  
  // Main text
  doc.setTextColor(...COLORS.white);
  doc.text(title, pageWidth / 2, 20, { align: "center" });
  
  // Subtitle
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.white);
  doc.text(subtitle, pageWidth / 2, 30, { align: "center" });
  
  // Decorative line
  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(0.5);
  const lineWidth = 60;
  doc.line(pageWidth / 2 - lineWidth / 2, 35, pageWidth / 2 + lineWidth / 2, 35);
}

// ============================================================
// CRITICAL FIX 3: White Branch Info Box (NOT BLACK!)
// ============================================================

function addBranchInfoBox(
  doc: jsPDF,
  branchName: string,
  startDate: Date,
  endDate: Date,
  yPosition: number
) {
  const pageWidth = doc.internal.pageSize.width;
  const boxHeight = 22;
  const boxPadding = 5;
  const boxX = 15;
  const boxWidth = pageWidth - 30;
  
  // WHITE background with blue border (CRITICAL FIX!)
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.lightBluePrimary);
  doc.setLineWidth(1.5);
  doc.roundedRect(boxX, yPosition, boxWidth, boxHeight, 4, 4, "FD");
  
  // Shadow effect (simulated)
  doc.setDrawColor(100, 181, 246);
  doc.setLineWidth(0.3);
  doc.setDrawColor(100, 181, 246, 0.2);
  doc.roundedRect(boxX + 0.5, yPosition + 0.5, boxWidth, boxHeight, 4, 4, "S");
  
  const supervisor = getSupervisorName(branchName);
  
  // Branch name (DARK BLUE, BOLD)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkBlueAccent);
  doc.text(`Branch: ${branchName}`, boxX + boxPadding, yPosition + 8);
  
  // Supervisor name (BLACK, NORMAL)
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.textBlack);
  doc.text(`Supervisor: ${supervisor}`, boxX + boxPadding, yPosition + 15);
  
  // Date range (GRAY, BOLD)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  try {
    const dateStr = `Report Period: ${format(new Date(startDate), "dd/MM/yyyy")} to ${format(new Date(endDate), "dd/MM/yyyy")}`;
    doc.text(dateStr, pageWidth - boxPadding - 15, yPosition + boxHeight - 5, { align: "right" });
  } catch (error) {
    console.error("Error formatting dates in branch box:", error);
    doc.text("Financial Report", pageWidth - boxPadding - 15, yPosition + boxHeight - 5, { align: "right" });
  }
  
  return yPosition + boxHeight + 10;
}

// ============================================================
// CRITICAL FIX 4: Professional Table with Perfect Alignment
// ============================================================

interface RevenueData {
  date: Date;
  cash?: number;
  network?: number;
  budget?: number;
  total?: number;
  calculatedTotal?: number;
  isMatched?: boolean;
}

function createRevenuesTable(doc: jsPDF, data: RevenueData[], startY: number) {
  const tableData = data.map((row) => {
    let dateStr = "";
    try {
      dateStr = format(new Date(row.date), "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date in table:", error, row.date);
      dateStr = "Invalid Date";
    }
    return [
      dateStr,
      row.cash?.toFixed(2) || "0.00",
      row.network?.toFixed(2) || "0.00",
      row.budget?.toFixed(2) || "0.00",
      row.total?.toFixed(2) || "0.00",
      row.isMatched ? "Matched" : "Not Matched",
    ];
  });
  
  autoTable(doc, {
    startY,
    head: [["Date", "Cash (SAR)", "Network (SAR)", "Budget (SAR)", "Total (SAR)", "Status"]],
    body: tableData,
    theme: "grid",
    
    // CRITICAL: Column widths to prevent cutoff
    columnStyles: {
      0: { cellWidth: 25, halign: "center" },      // Date
      1: { cellWidth: 30, halign: "right" },       // Cash
      2: { cellWidth: 30, halign: "right" },       // Network
      3: { cellWidth: 30, halign: "right" },       // Budget
      4: { cellWidth: 35, halign: "right" },       // Total
      5: { cellWidth: 30, halign: "center" },      // Status - FIXED WIDTH!
    },
    
    headStyles: {
      fillColor: COLORS.lightBluePrimary,
      textColor: COLORS.white,
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      lineColor: COLORS.deepBlue,
      lineWidth: 0.5,
      cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
    },
    
    bodyStyles: {
      fontSize: 11,
      textColor: COLORS.textBlack,
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      lineColor: [187, 222, 251],
      lineWidth: 0.5,
    },
    
    alternateRowStyles: {
      fillColor: COLORS.tableStripe,
    },
    
    styles: {
      font: "helvetica",
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    
    didParseCell: (data) => {
      // Status column - green for matched
      if (data.column.index === 5 && data.cell.text[0] === "Matched") {
        data.cell.styles.textColor = COLORS.successGreen;
        data.cell.styles.fontStyle = "bold";
      }
      
      // Amount columns - bold blue
      if (data.section === "body" && data.column.index >= 1 && data.column.index <= 4) {
        data.cell.styles.textColor = COLORS.darkBlueAccent;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  
  return (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

interface ExpenseData {
  title: string;
  category: string;
  amount: number;
  date: Date;
  description?: string;
}

function createExpensesTable(doc: jsPDF, data: ExpenseData[], startY: number) {
  const tableData = data.map((row) => {
    let dateStr = "";
    try {
      dateStr = format(new Date(row.date), "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date in expenses table:", error, row.date);
      dateStr = "Invalid Date";
    }
    return [
      row.title,
      row.category,
      row.amount.toFixed(2),
      dateStr,
      row.description || "-",
    ];
  });
  
  autoTable(doc, {
    startY,
    head: [["Title", "Category", "Amount (SAR)", "Date", "Description"]],
    body: tableData,
    theme: "grid",
    
    columnStyles: {
      0: { cellWidth: 40, halign: "left" },
      1: { cellWidth: 35, halign: "center" },
      2: { cellWidth: 30, halign: "right" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: 45, halign: "left" },
    },
    
    headStyles: {
      fillColor: COLORS.lightBluePrimary,
      textColor: COLORS.white,
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      lineColor: COLORS.deepBlue,
      lineWidth: 0.5,
      cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
    },
    
    bodyStyles: {
      fontSize: 11,
      textColor: COLORS.textBlack,
      cellPadding: { top: 5, right: 4, bottom: 5, left: 4 },
      lineColor: [187, 222, 251],
      lineWidth: 0.5,
    },
    
    alternateRowStyles: {
      fillColor: COLORS.tableStripe,
    },
    
    didParseCell: (data) => {
      // Amount column - bold blue
      if (data.section === "body" && data.column.index === 2) {
        data.cell.styles.textColor = COLORS.darkBlueAccent;
        data.cell.styles.fontStyle = "bold";
      }
    },
  });
  
  return (doc as typeof doc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

// ============================================================
// Summary Box with Gradient
// ============================================================

function drawGradientSummaryBox(
  doc: jsPDF,
  yPosition: number,
  summaries: Array<{ label: string; value: string }>
) {
  const pageWidth = doc.internal.pageSize.width;
  const boxHeight = summaries.length * 9 + 16;
  const boxX = 15;
  const boxWidth = pageWidth - 30;
  const layers = 20;
  
  // Gradient: Light Blue Primary → Light Blue Secondary
  for (let i = 0; i < layers; i++) {
    const progress = i / layers;
    const r = COLORS.lightBluePrimary[0] + (COLORS.lightBlueSecondary[0] - COLORS.lightBluePrimary[0]) * progress;
    const g = COLORS.lightBluePrimary[1] + (COLORS.lightBlueSecondary[1] - COLORS.lightBluePrimary[1]) * progress;
    const b = COLORS.lightBluePrimary[2] + (COLORS.lightBlueSecondary[2] - COLORS.lightBluePrimary[2]) * progress;
    
    doc.setFillColor(r, g, b);
    const layerHeight = boxHeight / layers;
    doc.roundedRect(boxX, yPosition + i * layerHeight, boxWidth, layerHeight + 0.1, 4, 4, "F");
  }
  
  // Border
  doc.setDrawColor(...COLORS.deepBlue);
  doc.setLineWidth(1.5);
  doc.roundedRect(boxX, yPosition, boxWidth, boxHeight, 4, 4, "S");
  
  // Content
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  
  let currentY = yPosition + 10;
  summaries.forEach((summary) => {
    doc.text(summary.label, boxX + 5, currentY);
    doc.text(summary.value, pageWidth - 20, currentY, { align: "right" });
    currentY += 9;
  });
  
  return yPosition + boxHeight;
}

// ============================================================
// CRITICAL FIX 5: Official Seal (35mm × 35mm)
// ============================================================

async function addOfficialSeal(doc: jsPDF) {
  const pageHeight = doc.internal.pageSize.height;
  const sealSize = 35;
  const sealX = doc.internal.pageSize.width - 20 - sealSize;
  const sealY = pageHeight - 60;
  
  try {
    const sealBase64 = await loadImageAsBase64("https://cdn.hercules.app/file_KxtpKU0KZ8CJ5zEVgJRzSTOG");
    if (sealBase64) {
      // Shadow effect
      // Shadow effect (simulated with offset)
      doc.addImage(sealBase64, "PNG", sealX + 0.5, sealY + 0.5, sealSize, sealSize);
      
      // Main seal
      doc.addImage(sealBase64, "PNG", sealX, sealY, sealSize, sealSize);
    }
  } catch (error) {
    console.error("Seal loading failed:", error);
  }
}

// ============================================================
// Footer with Gradient Line
// ============================================================

function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const footerY = pageHeight - 15;
  
  // Gradient line
  const lineY = footerY - 3;
  const segments = 20;
  for (let i = 0; i < segments; i++) {
    const progress = i / segments;
    const r = COLORS.lightBlueSecondary[0] + (COLORS.skyBlue[0] - COLORS.lightBlueSecondary[0]) * progress;
    const g = COLORS.lightBlueSecondary[1] + (COLORS.skyBlue[1] - COLORS.lightBlueSecondary[1]) * progress;
    const b = COLORS.lightBlueSecondary[2] + (COLORS.skyBlue[2] - COLORS.lightBlueSecondary[2]) * progress;
    
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(1);
    const segmentWidth = pageWidth / segments;
    doc.line(i * segmentWidth, lineY, (i + 1) * segmentWidth, lineY);
  }
  
  // Footer text
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  
  const dateStr = format(new Date(), "dd/MM/yyyy HH:mm");
  doc.text(`Generated: ${dateStr}`, 15, footerY);
  doc.text(`Page ${pageNumber} / ${totalPages}`, pageWidth - 15, footerY, { align: "right" });
}

// ============================================================
// Main Export Functions
// ============================================================

export async function generateRevenuesPDF(
  revenues: RevenueData[],
  branchName: string,
  startDate: Date,
  endDate: Date
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  
  // Header
  await addHeaderWithLogo(doc, "Revenue Report", "Financial Management System");
  
  // Branch info
  let currentY = await addBranchInfoBox(doc, branchName, startDate, endDate, 60);
  
  // Table
  currentY = createRevenuesTable(doc, revenues, currentY + 5);
  
  // Summary
  const totalCash = revenues.reduce((sum, r) => sum + (r.cash || 0), 0);
  const totalNetwork = revenues.reduce((sum, r) => sum + (r.network || 0), 0);
  const totalBudget = revenues.reduce((sum, r) => sum + (r.budget || 0), 0);
  const grandTotal = totalCash + totalNetwork + totalBudget;
  
  currentY = drawGradientSummaryBox(doc, currentY + 10, [
    { label: "Total Cash:", value: `${totalCash.toFixed(2)} SAR` },
    { label: "Total Network:", value: `${totalNetwork.toFixed(2)} SAR` },
    { label: "Total Budget:", value: `${totalBudget.toFixed(2)} SAR` },
    { label: "Grand Total:", value: `${grandTotal.toFixed(2)} SAR` },
  ]);
  
  // Seal
  await addOfficialSeal(doc);
  
  // Footer
  addFooter(doc, 1, 1);
  
  // Save
  const fileName = `Revenue_Report_${branchName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}

export async function generateExpensesPDF(
  expenses: ExpenseData[],
  branchName: string
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });
  
  // Header
  await addHeaderWithLogo(doc, "Expenses Report", "Financial Management System");
  
  // Branch info (using current date range)
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 1);
  let currentY = await addBranchInfoBox(doc, branchName, startDate, endDate, 60);
  
  // Table
  currentY = createExpensesTable(doc, expenses, currentY + 5);
  
  // Summary
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const categories = [...new Set(expenses.map((e) => e.category))];
  const categoryTotals = categories.map((cat) => ({
    category: cat,
    total: expenses.filter((e) => e.category === cat).reduce((sum, e) => sum + e.amount, 0),
  }));
  
  const summaries = [
    { label: "Total Expenses:", value: `${totalExpenses.toFixed(2)} SAR` },
    { label: "Total Transactions:", value: `${expenses.length}` },
  ];
  
  categoryTotals.forEach((ct) => {
    summaries.push({ label: `${ct.category}:`, value: `${ct.total.toFixed(2)} SAR` });
  });
  
  currentY = drawGradientSummaryBox(doc, currentY + 10, summaries);
  
  // Seal
  await addOfficialSeal(doc);
  
  // Footer
  addFooter(doc, 1, 1);
  
  // Save
  const fileName = `Expenses_Report_${branchName.replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
  doc.save(fileName);
}

// ============================================================
// Legacy API for backwards compatibility
// ============================================================

interface LegacyPDFOptions {
  title: string;
  subtitle?: string;
  branchName: string;
  dateRange?: { from: string; to: string };
  columns: Array<{ header: string; dataKey: string; align?: "left" | "center" | "right"; width?: number }>;
  data: Array<Record<string, string | number | boolean>>;
  summaries?: Array<{ label: string; value: string }>;
}

export async function generatePDF(options: LegacyPDFOptions) {
  if (options.title.includes("Revenue")) {
    // Map legacy format to new revenues format
    const revenues: RevenueData[] = options.data.map((row) => ({
      date: new Date(row.date as string),
      cash: typeof row.cash === "number" ? row.cash : undefined,
      network: typeof row.network === "number" ? row.network : undefined,
      budget: typeof row.budget === "number" ? row.budget : undefined,
      total: typeof row.total === "number" ? row.total : undefined,
      calculatedTotal: typeof row.calculatedTotal === "number" ? row.calculatedTotal : undefined,
      isMatched: row.isMatched === "Matched" || row.isMatched === "true" || row.isMatched === true,
    }));
    
    const startDate = options.dateRange?.from ? new Date(options.dateRange.from) : new Date();
    const endDate = options.dateRange?.to ? new Date(options.dateRange.to) : new Date();
    
    await generateRevenuesPDF(revenues, options.branchName, startDate, endDate);
  } else if (options.title.includes("Expense")) {
    // Map legacy format to new expenses format
    const expenses: ExpenseData[] = options.data.map((row) => ({
      title: String(row.title || ""),
      category: String(row.category || ""),
      amount: typeof row.amount === "number" ? row.amount : 0,
      date: new Date(row.date as string),
      description: row.description ? String(row.description) : undefined,
    }));
    
    await generateExpensesPDF(expenses, options.branchName);
  }
}

export async function printPDF(options: LegacyPDFOptions) {
  // Generate PDF first
  await generatePDF(options);
  
  // Note: Auto-print is not directly supported in jsPDF
  // The PDF will be saved and the user can print it manually
  console.log("PDF generated successfully");
}

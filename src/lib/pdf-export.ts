import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// ==========================================
// CMYK COLORS - Professional Blue Theme
// ==========================================
const COLORS = {
  // Primary Blues
  lightBluePrimary: [100, 181, 246], // #64B5F6
  lightBlueSecondary: [144, 202, 249], // #90CAF9
  skyBlue: [187, 222, 251], // #BBDEFB
  deepBlue: [33, 150, 243], // #2196F3
  darkBlueAccent: [13, 71, 161], // #0D47A1

  // Neutrals
  white: [255, 255, 255],
  textBlack: [33, 33, 33],
  lightGrayBg: [250, 250, 250],
  tableStripe: [227, 242, 253], // #E3F2FD
};

// Helper function to set RGB color
function setColor(
  doc: jsPDF,
  color: number[],
  type: "fill" | "text" | "draw" = "fill",
) {
  const [r, g, b] = color;
  if (type === "fill") {
    doc.setFillColor(r, g, b);
  } else if (type === "text") {
    doc.setTextColor(r, g, b);
  } else {
    doc.setDrawColor(r, g, b);
  }
}

// Helper to create gradient effect with multiple layers
function drawGradient(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  colorStart: number[],
  colorEnd: number[],
  steps: number = 30,
) {
  const stepHeight = height / steps;
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    const r = Math.round(colorStart[0] + (colorEnd[0] - colorStart[0]) * ratio);
    const g = Math.round(colorStart[1] + (colorEnd[1] - colorStart[1]) * ratio);
    const b = Math.round(colorStart[2] + (colorEnd[2] - colorStart[2]) * ratio);
    doc.setFillColor(r, g, b);
    doc.rect(x, y + i * stepHeight, width, stepHeight, "F");
  }
}

// Load image safely
async function loadImageSafely(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to load image from ${url}`);
      return null;
    }
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image:", error);
    return null;
  }
}

// Get supervisor name based on branch
function getSupervisorName(branchName: string): string {
  const lowerBranch = branchName.toLowerCase();
  if (lowerBranch.includes("لبن") || lowerBranch.includes("1010")) {
    return "عبدالهاي جلال";
  } else if (lowerBranch.includes("طويق") || lowerBranch.includes("2020")) {
    return "محمد إسماعيل";
  }
  return "غير محدد";
}

// Format currency
function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return "0.00";
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Format date safely
function formatDateSafely(date: Date | number | string): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return "تاريخ غير صحيح";
    }
    return format(dateObj, "dd/MM/yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "تاريخ غير صحيح";
  }
}

// ==========================================
// REVENUE PDF GENERATION
// ==========================================

type RevenueData = {
  date: Date | number | string;
  cash?: number;
  network?: number;
  budget?: number;
  total?: number;
  calculatedTotal?: number;
  isMatched?: boolean;
};

export async function generateRevenuesPDF(
  data: RevenueData[],
  branchName: string,
  startDate: Date,
  endDate: Date,
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;

  // ==========================================
  // HEADER WITH GRADIENT
  // ==========================================
  drawGradient(
    doc,
    0,
    0,
    pageWidth,
    50,
    COLORS.deepBlue,
    COLORS.lightBluePrimary,
    30,
  );

  // Add border to header
  setColor(doc, COLORS.deepBlue, "draw");
  doc.setLineWidth(3);
  doc.line(0, 50, pageWidth, 50);

  // Load and add logo
  const logoUrl = "https://cdn.hercules.app/file_2EDW4ulZlmwarzzXHgYjO1Hv";
  const logoData = await loadImageSafely(logoUrl);
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", pageWidth / 2 - 15, 5, 30, 30);
    } catch (error) {
      console.error("Error adding logo:", error);
    }
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setColor(doc, COLORS.white, "text");
  doc.text("تقرير الإيرادات", pageWidth / 2, 42, { align: "center" });

  yPos = 60;

  // ==========================================
  // BRANCH INFO BOX
  // ==========================================
  const boxX = 15;
  const boxWidth = pageWidth - 30;
  const boxHeight = 22;

  // White background
  setColor(doc, COLORS.white, "fill");
  doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 4, 4, "F");

  // Blue border
  setColor(doc, COLORS.lightBluePrimary, "draw");
  doc.setLineWidth(1.5);
  doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 4, 4, "S");

  // Branch name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setColor(doc, COLORS.darkBlueAccent, "text");
  doc.text(`الفرع: ${branchName}`, pageWidth - 20, yPos + 8, {
    align: "right",
  });

  // Supervisor
  const supervisor = getSupervisorName(branchName);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setColor(doc, COLORS.textBlack, "text");
  doc.text(`المشرف: ${supervisor}`, pageWidth - 20, yPos + 16, {
    align: "right",
  });

  yPos += boxHeight + 5;

  // Period
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  setColor(doc, COLORS.textBlack, "text");
  const startStr = formatDateSafely(startDate);
  const endStr = formatDateSafely(endDate);
  doc.text(
    `الفترة: من ${startStr} إلى ${endStr}`,
    pageWidth / 2,
    yPos + 5,
    { align: "center" },
  );

  yPos += 15;

  // ==========================================
  // TABLE WITH ENHANCED BORDERS
  // ==========================================
  const tableData = data.map((row) => [
    formatDateSafely(row.date),
    formatCurrency(row.cash),
    formatCurrency(row.network),
    formatCurrency(row.budget),
    formatCurrency(row.calculatedTotal || row.total),
    row.isMatched ? "متطابق ✓" : "غير متطابق ✗",
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["التاريخ", "كاش", "شبكة", "موازنة", "الإجمالي", "الحالة"]],
    body: tableData,
    theme: "grid", // Use grid theme for clear borders
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 5,
      lineColor: COLORS.lightBlueSecondary as [number, number, number],
      lineWidth: 0.5,
      halign: "center",
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.lightBluePrimary as [number, number, number],
      textColor: COLORS.white as [number, number, number],
      fontStyle: "bold",
      fontSize: 12,
      halign: "center",
      lineWidth: 1,
      lineColor: COLORS.deepBlue as [number, number, number],
    },
    alternateRowStyles: {
      fillColor: COLORS.tableStripe as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 25, halign: "center" }, // Date
      1: { cellWidth: 30, halign: "right" }, // Cash
      2: { cellWidth: 30, halign: "right" }, // Network
      3: { cellWidth: 30, halign: "right" }, // Budget
      4: { cellWidth: 35, halign: "right", fontStyle: "bold" }, // Total
      5: { cellWidth: 30, halign: "center" }, // Status
    },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ==========================================
  // SUMMARY BOX WITH GRADIENT
  // ==========================================
  const summaryBoxHeight = 30;
  drawGradient(
    doc,
    15,
    yPos,
    boxWidth,
    summaryBoxHeight,
    COLORS.lightBluePrimary,
    COLORS.lightBlueSecondary,
    20,
  );

  // Border
  setColor(doc, COLORS.deepBlue, "draw");
  doc.setLineWidth(1.5);
  doc.roundedRect(15, yPos, boxWidth, summaryBoxHeight, 4, 4, "S");

  // Calculate totals
  const totalCash = data.reduce((sum, row) => sum + (row.cash || 0), 0);
  const totalNetwork = data.reduce((sum, row) => sum + (row.network || 0), 0);
  const totalBudget = data.reduce((sum, row) => sum + (row.budget || 0), 0);
  const grandTotal = totalCash + totalNetwork + totalBudget;

  // Summary text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, COLORS.white, "text");

  doc.text(
    `إجمالي الكاش: ${formatCurrency(totalCash)} ريال`,
    pageWidth - 20,
    yPos + 8,
    { align: "right" },
  );
  doc.text(
    `إجمالي الشبكة: ${formatCurrency(totalNetwork)} ريال`,
    pageWidth - 20,
    yPos + 16,
    { align: "right" },
  );
  doc.text(
    `المجموع الكلي: ${formatCurrency(grandTotal)} ريال`,
    pageWidth - 20,
    yPos + 24,
    { align: "right" },
  );

  // ==========================================
  // STAMP AT BOTTOM
  // ==========================================
  const stampSize = 35;
  const stampX = pageWidth / 2 - stampSize / 2;
  const stampY = pageHeight - 60;

  const stampUrl = "https://cdn.hercules.app/file_KxtpKU0KZ8CJ5zEVgJRzSTOG";
  const stampData = await loadImageSafely(stampUrl);
  if (stampData) {
    try {
      doc.addImage(stampData, "PNG", stampX, stampY, stampSize, stampSize);
    } catch (error) {
      console.error("Error adding stamp:", error);
    }
  }

  // "معتمد" text below stamp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, COLORS.deepBlue, "text");
  doc.text("معتمد", pageWidth / 2, stampY + stampSize + 8, {
    align: "center",
  });

  // ==========================================
  // FOOTER
  // ==========================================
  const footerY = pageHeight - 15;

  // Gradient line
  const gradientLineY = footerY - 3;
  for (let i = 0; i < 20; i++) {
    const ratio = i / 20;
    const x = 15 + (boxWidth * i) / 20;
    const width = boxWidth / 20;
    const r = Math.round(
      COLORS.lightBlueSecondary[0] +
        (COLORS.skyBlue[0] - COLORS.lightBlueSecondary[0]) * ratio,
    );
    const g = Math.round(
      COLORS.lightBlueSecondary[1] +
        (COLORS.skyBlue[1] - COLORS.lightBlueSecondary[1]) * ratio,
    );
    const b = Math.round(
      COLORS.lightBlueSecondary[2] +
        (COLORS.skyBlue[2] - COLORS.lightBlueSecondary[2]) * ratio,
    );
    doc.setFillColor(r, g, b);
    doc.rect(x, gradientLineY, width, 1, "F");
  }

  // Footer text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, [100, 100, 100], "text");

  const now = new Date();
  const dateTimeStr = format(now, "dd/MM/yyyy HH:mm");
  doc.text(`تاريخ الإنشاء: ${dateTimeStr}`, 20, footerY, { align: "left" });
  doc.text(`صفحة 1 / 1`, pageWidth - 20, footerY, { align: "right" });

  // Save
  const fileName = `تقرير_الإيرادات_${branchName}_${formatDateSafely(startDate)}.pdf`;
  doc.save(fileName);
}

// ==========================================
// EXPENSE PDF GENERATION
// ==========================================

type ExpenseData = {
  title: string;
  category: string;
  amount: number;
  date: Date | number | string;
  description?: string;
};

export async function generateExpensesPDF(
  data: ExpenseData[],
  branchName: string,
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 15;

  // ==========================================
  // HEADER WITH GRADIENT
  // ==========================================
  drawGradient(
    doc,
    0,
    0,
    pageWidth,
    50,
    COLORS.deepBlue,
    COLORS.lightBluePrimary,
    30,
  );

  // Add border to header
  setColor(doc, COLORS.deepBlue, "draw");
  doc.setLineWidth(3);
  doc.line(0, 50, pageWidth, 50);

  // Load and add logo
  const logoUrl = "https://cdn.hercules.app/file_2EDW4ulZlmwarzzXHgYjO1Hv";
  const logoData = await loadImageSafely(logoUrl);
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", pageWidth / 2 - 15, 5, 30, 30);
    } catch (error) {
      console.error("Error adding logo:", error);
    }
  }

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  setColor(doc, COLORS.white, "text");
  doc.text("تقرير المصروفات", pageWidth / 2, 42, { align: "center" });

  yPos = 60;

  // ==========================================
  // BRANCH INFO BOX
  // ==========================================
  const boxX = 15;
  const boxWidth = pageWidth - 30;
  const boxHeight = 22;

  // White background
  setColor(doc, COLORS.white, "fill");
  doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 4, 4, "F");

  // Blue border
  setColor(doc, COLORS.lightBluePrimary, "draw");
  doc.setLineWidth(1.5);
  doc.roundedRect(boxX, yPos, boxWidth, boxHeight, 4, 4, "S");

  // Branch name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  setColor(doc, COLORS.darkBlueAccent, "text");
  doc.text(`الفرع: ${branchName}`, pageWidth - 20, yPos + 8, {
    align: "right",
  });

  // Supervisor
  const supervisor = getSupervisorName(branchName);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  setColor(doc, COLORS.textBlack, "text");
  doc.text(`المشرف: ${supervisor}`, pageWidth - 20, yPos + 16, {
    align: "right",
  });

  yPos += boxHeight + 10;

  // ==========================================
  // TABLE WITH ENHANCED BORDERS
  // ==========================================
  const tableData = data.map((row) => [
    row.title,
    row.category,
    formatCurrency(row.amount),
    formatDateSafely(row.date),
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [["العنوان", "التصنيف", "المبلغ (ريال)", "التاريخ"]],
    body: tableData,
    theme: "grid", // Use grid theme for clear borders
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 5,
      lineColor: COLORS.lightBlueSecondary as [number, number, number],
      lineWidth: 0.5,
      halign: "center",
      valign: "middle",
    },
    headStyles: {
      fillColor: COLORS.lightBluePrimary as [number, number, number],
      textColor: COLORS.white as [number, number, number],
      fontStyle: "bold",
      fontSize: 12,
      halign: "center",
      lineWidth: 1,
      lineColor: COLORS.deepBlue as [number, number, number],
    },
    alternateRowStyles: {
      fillColor: COLORS.tableStripe as [number, number, number],
    },
    columnStyles: {
      0: { cellWidth: 60, halign: "right" }, // Title
      1: { cellWidth: 40, halign: "center" }, // Category
      2: { cellWidth: 35, halign: "right", fontStyle: "bold" }, // Amount
      3: { cellWidth: 25, halign: "center" }, // Date
    },
    margin: { left: 15, right: 15 },
  });

  yPos = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ==========================================
  // SUMMARY BOX WITH GRADIENT
  // ==========================================
  const summaryBoxHeight = 22;
  drawGradient(
    doc,
    15,
    yPos,
    boxWidth,
    summaryBoxHeight,
    COLORS.lightBluePrimary,
    COLORS.lightBlueSecondary,
    20,
  );

  // Border
  setColor(doc, COLORS.deepBlue, "draw");
  doc.setLineWidth(1.5);
  doc.roundedRect(15, yPos, boxWidth, summaryBoxHeight, 4, 4, "S");

  // Calculate totals
  const totalExpenses = data.reduce((sum, row) => sum + (row.amount || 0), 0);
  const totalTransactions = data.length;

  // Summary text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, COLORS.white, "text");

  doc.text(
    `إجمالي المصروفات: ${formatCurrency(totalExpenses)} ريال`,
    pageWidth - 20,
    yPos + 8,
    { align: "right" },
  );
  doc.text(
    `عدد العمليات: ${totalTransactions}`,
    pageWidth - 20,
    yPos + 16,
    { align: "right" },
  );

  // ==========================================
  // STAMP AT BOTTOM
  // ==========================================
  const stampSize = 35;
  const stampX = pageWidth / 2 - stampSize / 2;
  const stampY = pageHeight - 60;

  const stampUrl = "https://cdn.hercules.app/file_KxtpKU0KZ8CJ5zEVgJRzSTOG";
  const stampData = await loadImageSafely(stampUrl);
  if (stampData) {
    try {
      doc.addImage(stampData, "PNG", stampX, stampY, stampSize, stampSize);
    } catch (error) {
      console.error("Error adding stamp:", error);
    }
  }

  // "معتمد" text below stamp
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  setColor(doc, COLORS.deepBlue, "text");
  doc.text("معتمد", pageWidth / 2, stampY + stampSize + 8, {
    align: "center",
  });

  // ==========================================
  // FOOTER
  // ==========================================
  const footerY = pageHeight - 15;

  // Gradient line
  const gradientLineY = footerY - 3;
  for (let i = 0; i < 20; i++) {
    const ratio = i / 20;
    const x = 15 + (boxWidth * i) / 20;
    const width = boxWidth / 20;
    const r = Math.round(
      COLORS.lightBlueSecondary[0] +
        (COLORS.skyBlue[0] - COLORS.lightBlueSecondary[0]) * ratio,
    );
    const g = Math.round(
      COLORS.lightBlueSecondary[1] +
        (COLORS.skyBlue[1] - COLORS.lightBlueSecondary[1]) * ratio,
    );
    const b = Math.round(
      COLORS.lightBlueSecondary[2] +
        (COLORS.skyBlue[2] - COLORS.lightBlueSecondary[2]) * ratio,
    );
    doc.setFillColor(r, g, b);
    doc.rect(x, gradientLineY, width, 1, "F");
  }

  // Footer text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  setColor(doc, [100, 100, 100], "text");

  const now = new Date();
  const dateTimeStr = format(now, "dd/MM/yyyy HH:mm");
  doc.text(`تاريخ الإنشاء: ${dateTimeStr}`, 20, footerY, { align: "left" });
  doc.text(`صفحة 1 / 1`, pageWidth - 20, footerY, { align: "right" });

  // Save
  const fileName = `تقرير_المصروفات_${branchName}_${dateTimeStr}.pdf`;
  doc.save(fileName);
}

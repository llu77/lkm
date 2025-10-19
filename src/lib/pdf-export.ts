import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface PDFHeader {
  title: string;
  subtitle?: string;
  branchName: string;
  dateRange?: {
    from: string;
    to: string;
  };
}

interface PDFColumn {
  header: string;
  dataKey: string;
  align?: "left" | "center" | "right";
  width?: number;
}

interface PDFData {
  [key: string]: string | number;
}

// 🎨 Color Palette - Light Blue Professional Theme
const COLORS = {
  // Primary Colors
  lightBluePrimary: [100, 181, 246],      // #64B5F6
  lightBlueSecondary: [144, 202, 249],    // #90CAF9
  skyBlue: [187, 222, 251],               // #BBDEFB
  deepBlue: [33, 150, 243],               // #2196F3
  darkBlueAccent: [13, 71, 161],          // #0D47A1
  
  // Backgrounds
  white: [255, 255, 255],                 // #FFFFFF
  lightGrayBg: [250, 250, 250],           // #FAFAFA
  tableStripe: [227, 242, 253],           // #E3F2FD
  
  // Text
  textBlack: [33, 33, 33],                // #212121
  textGray: [100, 100, 100],              // #646464
  textLightGray: [150, 150, 150],         // #969696
} as const;

const LOGO_URL = "https://cdn.hercules.app/file_2EDW4ulZlmwarzzXHgYjO1Hv";
const STAMP_URL = "https://cdn.hercules.app/file_KxtpKU0KZ8CJ5zEVgJRzSTOG";

// معلومات المشرفين حسب الفرع
const BRANCH_SUPERVISORS: Record<string, string> = {
  "1010": "Abdulhai Jalal",
  "لبن": "Abdulhai Jalal",
  "labn": "Abdulhai Jalal",
  "2020": "Mohammed Ismail",
  "طويق": "Mohammed Ismail",
  "tuwaiq": "Mohammed Ismail",
};

function getSupervisorName(branchName: string): string {
  const normalizedBranch = branchName.toLowerCase();
  for (const [key, supervisor] of Object.entries(BRANCH_SUPERVISORS)) {
    if (normalizedBranch.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedBranch)) {
      return supervisor;
    }
  }
  return "";
}

async function loadImage(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Failed to convert image to base64"));
        }
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Image loading error:", error);
    throw error;
  }
}

// 🎨 رسم تدرج أزرق محاكى (jsPDF لا يدعم التدرجات مباشرة)
function drawGradientHeader(doc: jsPDF, y: number, height: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const steps = 30; // عدد الطبقات للتدرج
  const stepHeight = height / steps;
  
  for (let i = 0; i < steps; i++) {
    const ratio = i / steps;
    
    // تدرج من deep blue → light blue primary → sky blue
    let r: number, g: number, b: number;
    
    if (ratio < 0.5) {
      // من deep blue إلى light blue primary
      const localRatio = ratio * 2;
      r = COLORS.deepBlue[0] + (COLORS.lightBluePrimary[0] - COLORS.deepBlue[0]) * localRatio;
      g = COLORS.deepBlue[1] + (COLORS.lightBluePrimary[1] - COLORS.deepBlue[1]) * localRatio;
      b = COLORS.deepBlue[2] + (COLORS.lightBluePrimary[2] - COLORS.deepBlue[2]) * localRatio;
    } else {
      // من light blue primary إلى sky blue
      const localRatio = (ratio - 0.5) * 2;
      r = COLORS.lightBluePrimary[0] + (COLORS.skyBlue[0] - COLORS.lightBluePrimary[0]) * localRatio;
      g = COLORS.lightBluePrimary[1] + (COLORS.skyBlue[1] - COLORS.lightBluePrimary[1]) * localRatio;
      b = COLORS.lightBluePrimary[2] + (COLORS.skyBlue[2] - COLORS.lightBluePrimary[2]) * localRatio;
    }
    
    doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
    doc.rect(0, y + i * stepHeight, pageWidth, stepHeight, "F");
  }
}

async function addHeaderToDoc(doc: jsPDF, header: PDFHeader): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 0;

  // 🎨 رسم هيدر بتدرج أزرق احترافي
  const headerHeight = 50;
  drawGradientHeader(doc, 0, headerHeight);
  
  // خط فاصل في الأسفل
  doc.setDrawColor(...COLORS.deepBlue);
  doc.setLineWidth(2);
  doc.line(0, headerHeight, pageWidth, headerHeight);

  currentY = 10;

  try {
    // تحميل وإضافة الشعار
    const logoData = await loadImage(LOGO_URL);
    const logoSize = 30;
    doc.addImage(logoData, "PNG", (pageWidth - logoSize) / 2, currentY, logoSize, logoSize);
    currentY += logoSize + 5;
  } catch (error) {
    console.error("Failed to load logo:", error);
    currentY += 5;
  }

  // العنوان الرئيسي مع ظل نصي
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  
  // ظل النص (محاكاة)
  doc.setTextColor(...COLORS.darkBlueAccent);
  doc.text(header.title, pageWidth / 2 + 0.5, currentY + 0.5, { align: "center" });
  
  // النص الرئيسي
  doc.setTextColor(...COLORS.white);
  doc.text(header.title, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  // العنوان الفرعي
  if (header.subtitle) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.white);
    doc.text(header.subtitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 5;
  }

  // خط فاصل زخرفي
  doc.setDrawColor(...COLORS.white);
  doc.setLineWidth(1);
  const lineWidth = 60;
  doc.line((pageWidth - lineWidth) / 2, currentY, (pageWidth + lineWidth) / 2, currentY);

  currentY = headerHeight + 8;

  // 📋 صندوق معلومات الفرع والمشرف
  const boxY = currentY;
  const boxHeight = 22;
  
  // خلفية بيضاء مع ظل
  doc.setFillColor(...COLORS.white);
  doc.setDrawColor(...COLORS.lightBluePrimary);
  doc.setLineWidth(1.5);
  doc.roundedRect(15, boxY, pageWidth - 30, boxHeight, 4, 4, "FD");
  
  // ظل الصندوق (محاكاة)
  doc.setFillColor(100, 181, 246, 50); // شفافية محاكاة
  doc.setDrawColor(100, 181, 246, 0);
  doc.roundedRect(15.5, boxY + 0.5, pageWidth - 30, boxHeight, 4, 4, "F");
  
  currentY = boxY + 8;

  // 📍 أيقونة + اسم الفرع
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkBlueAccent);
  doc.text(`📍 Branch: ${header.branchName}`, pageWidth / 2, currentY, { align: "center" });
  currentY += 7;

  // 👤 أيقونة + اسم المشرف
  const supervisorName = getSupervisorName(header.branchName);
  if (supervisorName) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.textBlack);
    doc.text(`👤 Supervisor: ${supervisorName}`, pageWidth / 2, currentY, { align: "center" });
  }

  currentY = boxY + boxHeight + 8;

  // 📅 الفترة الزمنية
  if (header.dateRange) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.textGray);
    doc.text(
      `📅 Report Period: ${header.dateRange.from} to ${header.dateRange.to}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 10;
  }

  // خط فاصل احترافي مع تدرج
  doc.setDrawColor(...COLORS.lightBluePrimary);
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 8;

  return currentY;
}

async function addStampToDoc(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  try {
    const stampData = await loadImage(STAMP_URL);
    const stampSize = 35; // حجم ممتاز حسب المواصفات
    const stampX = pageWidth - stampSize - 20; // 20mm من اليمين
    const stampY = pageHeight - stampSize - 25; // 25mm من الأسفل
    
    // ظل الختم (محاكاة)
    doc.setFillColor(100, 181, 246, 30);
    const shadowOffset = 1;
    doc.ellipse(stampX + stampSize/2 + shadowOffset, stampY + stampSize/2 + shadowOffset, stampSize/2 + 1, stampSize/2 + 1, "F");
    
    // إضافة الختم
    doc.addImage(stampData, "PNG", stampX, stampY, stampSize, stampSize);
    
    console.log("✅ Stamp added successfully at:", { stampX, stampY, stampSize });
  } catch (error) {
    console.error("❌ Failed to load stamp:", error);
  }
}

export async function generatePDF({
  header,
  columns,
  data,
  totals,
  fileName,
}: {
  header: PDFHeader;
  columns: PDFColumn[];
  data: PDFData[];
  totals?: { label: string; value: string | number }[];
  fileName: string;
}) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // إضافة الهيدر المتدرج
  const startY = await addHeaderToDoc(doc, header);

  // إعداد أنماط الأعمدة
  const columnStyles: Record<number, { halign?: "left" | "center" | "right"; cellWidth?: number | "auto" | "wrap" }> = {};
  
  columns.forEach((col, index) => {
    columnStyles[index] = {
      halign: col.align || "center",
      cellWidth: col.width || "auto",
    };
  });

  // 📊 الجدول المالي الاحترافي
  autoTable(doc, {
    startY: startY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => String(row[col.dataKey] || "-"))),
    
    theme: "grid",
    
    headStyles: {
      fillColor: COLORS.lightBluePrimary as [number, number, number], // أزرق فاتح أساسي
      textColor: COLORS.white as [number, number, number],
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
      lineWidth: 0.1,
      lineColor: COLORS.deepBlue as [number, number, number],
    },
    
    bodyStyles: {
      fontSize: 11,
      textColor: COLORS.textBlack as [number, number, number],
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      lineWidth: 0.1,
      lineColor: COLORS.lightBlueSecondary as [number, number, number],
    },
    
    alternateRowStyles: {
      fillColor: COLORS.tableStripe as [number, number, number], // أزرق فاتح جداً
    },
    
    columnStyles: columnStyles,
    
    margin: { top: 10, left: 15, right: 15, bottom: 40 },
    
    tableLineColor: COLORS.lightBlueSecondary as [number, number, number],
    tableLineWidth: 0.5,
    
    didDrawPage: (data) => {
      // 🎨 تذييل احترافي مع تدرج
      const footerY = pageHeight - 15;
      
      // خط فاصل مع تدرج (محاكاة)
      for (let i = 0; i < 20; i++) {
        const x = 15 + (i / 20) * (pageWidth - 30);
        const width = (pageWidth - 30) / 20;
        const ratio = i / 20;
        
        const r = COLORS.lightBlueSecondary[0] + (COLORS.skyBlue[0] - COLORS.lightBlueSecondary[0]) * ratio;
        const g = COLORS.lightBlueSecondary[1] + (COLORS.skyBlue[1] - COLORS.lightBlueSecondary[1]) * ratio;
        const b = COLORS.lightBlueSecondary[2] + (COLORS.skyBlue[2] - COLORS.lightBlueSecondary[2]) * ratio;
        
        doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
        doc.rect(x, footerY - 3, width, 1, "F");
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textGray);
      
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      doc.text(`Generated: ${dateStr} ${timeStr}`, 15, footerY);
      
      const docInternal = doc.internal as typeof doc.internal & { getCurrentPageInfo(): { pageNumber: number } };
      const pageInfo = docInternal.getCurrentPageInfo();
      const pageNum = pageInfo.pageNumber;
      const totalPages = (doc.internal as typeof doc.internal & { getNumberOfPages(): number }).getNumberOfPages();
      
      doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - 15, footerY, { align: "right" });
    },
  });

  // 💰 صندوق الإجماليات مع تدرج
  if (totals && totals.length > 0) {
    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const finalY = docWithTable.lastAutoTable?.finalY || startY;
    let currentY = finalY + 15;

    const totalsHeight = totals.length * 9 + 16;
    if (currentY + totalsHeight > pageHeight - 45) {
      doc.addPage();
      currentY = 25;
    }

    // رسم تدرج للصندوق
    const steps = 20;
    const stepHeight = totalsHeight / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = COLORS.lightBluePrimary[0] + (COLORS.lightBlueSecondary[0] - COLORS.lightBluePrimary[0]) * ratio;
      const g = COLORS.lightBluePrimary[1] + (COLORS.lightBlueSecondary[1] - COLORS.lightBluePrimary[1]) * ratio;
      const b = COLORS.lightBluePrimary[2] + (COLORS.lightBlueSecondary[2] - COLORS.lightBluePrimary[2]) * ratio;
      
      doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
      doc.rect(15, currentY + i * stepHeight, pageWidth - 30, stepHeight, "F");
    }
    
    // إطار الصندوق
    doc.setDrawColor(...COLORS.deepBlue);
    doc.setLineWidth(1.5);
    doc.roundedRect(15, currentY, pageWidth - 30, totalsHeight, 4, 4, "S");
    
    // ظل الصندوق
    doc.setFillColor(100, 181, 246, 40);
    doc.roundedRect(15.5, currentY + 0.5, pageWidth - 30, totalsHeight, 4, 4);
    
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    
    totals.forEach((total, index) => {
      const y = currentY + 12 + index * 9;
      doc.text(total.label, 20, y);
      doc.text(String(total.value), pageWidth - 20, y, { align: "right" });
    });
  }

  // ✅ إضافة الختم الرسمي
  await addStampToDoc(doc);

  // 💾 حفظ الملف
  doc.save(`${fileName}.pdf`);
}

export async function printPDF(pdfOptions: Parameters<typeof generatePDF>[0]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // إضافة الهيدر
  const startY = await addHeaderToDoc(doc, pdfOptions.header);

  // إعداد أنماط الأعمدة
  const columnStyles: Record<number, { halign?: "left" | "center" | "right"; cellWidth?: number | "auto" | "wrap" }> = {};
  
  pdfOptions.columns.forEach((col, index) => {
    columnStyles[index] = {
      halign: col.align || "center",
      cellWidth: col.width || "auto",
    };
  });

  // الجدول
  autoTable(doc, {
    startY: startY,
    head: [pdfOptions.columns.map((col) => col.header)],
    body: pdfOptions.data.map((row) =>
      pdfOptions.columns.map((col) => String(row[col.dataKey] || "-"))
    ),
    
    theme: "grid",
    
    headStyles: {
      fillColor: COLORS.lightBluePrimary as [number, number, number],
      textColor: COLORS.white as [number, number, number],
      fontSize: 12,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 6, bottom: 6, left: 4, right: 4 },
      lineWidth: 0.1,
      lineColor: COLORS.deepBlue as [number, number, number],
    },
    
    bodyStyles: {
      fontSize: 11,
      textColor: COLORS.textBlack as [number, number, number],
      cellPadding: { top: 5, bottom: 5, left: 4, right: 4 },
      lineWidth: 0.1,
      lineColor: COLORS.lightBlueSecondary as [number, number, number],
    },
    
    alternateRowStyles: {
      fillColor: COLORS.tableStripe as [number, number, number],
    },
    
    columnStyles: columnStyles,
    
    margin: { top: 10, left: 15, right: 15, bottom: 40 },
    
    tableLineColor: COLORS.lightBlueSecondary as [number, number, number],
    tableLineWidth: 0.5,
    
    didDrawPage: (data) => {
      const footerY = pageHeight - 15;
      
      // خط فاصل مع تدرج
      for (let i = 0; i < 20; i++) {
        const x = 15 + (i / 20) * (pageWidth - 30);
        const width = (pageWidth - 30) / 20;
        const ratio = i / 20;
        
        const r = COLORS.lightBlueSecondary[0] + (COLORS.skyBlue[0] - COLORS.lightBlueSecondary[0]) * ratio;
        const g = COLORS.lightBlueSecondary[1] + (COLORS.skyBlue[1] - COLORS.lightBlueSecondary[1]) * ratio;
        const b = COLORS.lightBlueSecondary[2] + (COLORS.skyBlue[2] - COLORS.lightBlueSecondary[2]) * ratio;
        
        doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
        doc.rect(x, footerY - 3, width, 1, "F");
      }
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...COLORS.textGray);
      
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const timeStr = now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      doc.text(`Generated: ${dateStr} ${timeStr}`, 15, footerY);
      
      const docInternal = doc.internal as typeof doc.internal & { getCurrentPageInfo(): { pageNumber: number } };
      const pageInfo = docInternal.getCurrentPageInfo();
      const pageNum = pageInfo.pageNumber;
      const totalPages = (doc.internal as typeof doc.internal & { getNumberOfPages(): number }).getNumberOfPages();
      
      doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - 15, footerY, { align: "right" });
    },
  });

  // الإجماليات
  if (pdfOptions.totals && pdfOptions.totals.length > 0) {
    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const finalY = docWithTable.lastAutoTable?.finalY || startY;
    let currentY = finalY + 15;

    const totalsHeight = pdfOptions.totals.length * 9 + 16;
    if (currentY + totalsHeight > pageHeight - 45) {
      doc.addPage();
      currentY = 25;
    }

    // رسم تدرج
    const steps = 20;
    const stepHeight = totalsHeight / steps;
    for (let i = 0; i < steps; i++) {
      const ratio = i / steps;
      const r = COLORS.lightBluePrimary[0] + (COLORS.lightBlueSecondary[0] - COLORS.lightBluePrimary[0]) * ratio;
      const g = COLORS.lightBluePrimary[1] + (COLORS.lightBlueSecondary[1] - COLORS.lightBluePrimary[1]) * ratio;
      const b = COLORS.lightBluePrimary[2] + (COLORS.lightBlueSecondary[2] - COLORS.lightBluePrimary[2]) * ratio;
      
      doc.setFillColor(Math.round(r), Math.round(g), Math.round(b));
      doc.rect(15, currentY + i * stepHeight, pageWidth - 30, stepHeight, "F");
    }
    
    doc.setDrawColor(...COLORS.deepBlue);
    doc.setLineWidth(1.5);
    doc.roundedRect(15, currentY, pageWidth - 30, totalsHeight, 4, 4, "S");
    
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.white);
    
    pdfOptions.totals.forEach((total, index) => {
      const y = currentY + 12 + index * 9;
      doc.text(total.label, 20, y);
      doc.text(String(total.value), pageWidth - 20, y, { align: "right" });
    });
  }

  // إضافة الختم
  await addStampToDoc(doc);

  // فتح نافذة الطباعة
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

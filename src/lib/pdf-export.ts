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
    // استخدام fetch لتحميل الصورة (أفضل لتجاوز CORS)
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

async function addHeaderToDoc(doc: jsPDF, header: PDFHeader): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 10;

  try {
    // تحميل وإضافة الشعار
    const logoData = await loadImage(LOGO_URL);
    const logoSize = 35;
    doc.addImage(logoData, "PNG", (pageWidth - logoSize) / 2, currentY, logoSize, logoSize);
    currentY += logoSize + 10;
  } catch (error) {
    console.error("Failed to load logo:", error);
    currentY += 5;
  }

  // العنوان الرئيسي
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(25, 77, 51); // أخضر داكن احترافي
  doc.text(header.title, pageWidth / 2, currentY, { align: "center" });
  currentY += 8;

  // العنوان الفرعي
  if (header.subtitle) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(header.subtitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 7;
  }

  // صندوق معلومات الفرع والمشرف
  const boxY = currentY;
  const boxHeight = 20;
  
  // رسم مستطيل بخلفية فاتحة
  doc.setFillColor(245, 250, 247);
  doc.setDrawColor(25, 77, 51);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, boxY, pageWidth - 40, boxHeight, 2, 2, "FD");
  
  currentY = boxY + 7;

  // اسم الفرع
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(25, 77, 51);
  doc.text(`Branch: ${header.branchName}`, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  // اسم المشرف
  const supervisorName = getSupervisorName(header.branchName);
  if (supervisorName) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Supervisor: ${supervisorName}`, pageWidth / 2, currentY, { align: "center" });
  }

  currentY = boxY + boxHeight + 6;

  // الفترة الزمنية
  if (header.dateRange) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Report Period: ${header.dateRange.from} to ${header.dateRange.to}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 8;
  }

  // خط فاصل احترافي
  doc.setDrawColor(25, 77, 51);
  doc.setLineWidth(1);
  doc.line(20, currentY, pageWidth - 20, currentY);
  currentY += 8;

  return currentY;
}

async function addStampToDoc(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  try {
    const stampData = await loadImage(STAMP_URL);
    const stampSize = 40;
    const stampX = pageWidth - stampSize - 15;
    const stampY = pageHeight - stampSize - 20;
    
    // إضافة الختم
    doc.addImage(stampData, "PNG", stampX, stampY, stampSize, stampSize);
    
    console.log("Stamp added successfully at:", { stampX, stampY, stampSize });
  } catch (error) {
    console.error("Failed to load stamp:", error);
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

  // إضافة الهيدر
  const startY = await addHeaderToDoc(doc, header);

  // إعداد أنماط الجدول الاحترافية
  const columnStyles: Record<number, { halign?: "left" | "center" | "right"; cellWidth?: number | "auto" | "wrap" }> = {};
  
  columns.forEach((col, index) => {
    columnStyles[index] = {
      halign: col.align || "center",
      cellWidth: col.width || "auto",
    };
  });

  // الجدول مع تنسيق مالي احترافي
  autoTable(doc, {
    startY: startY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => String(row[col.dataKey] || "-"))),
    
    theme: "grid",
    
    headStyles: {
      fillColor: [25, 77, 51], // أخضر داكن
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    
    bodyStyles: {
      fontSize: 10,
      textColor: [40, 40, 40],
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    
    alternateRowStyles: {
      fillColor: [248, 252, 249], // أخضر فاتح جداً
    },
    
    columnStyles: columnStyles,
    
    margin: { top: 10, left: 12, right: 12, bottom: 35 },
    
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.1,
    
    didDrawPage: (data) => {
      // تذييل الصفحة
      const footerY = pageHeight - 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      
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

  // الإجماليات في صندوق احترافي
  if (totals && totals.length > 0) {
    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const finalY = docWithTable.lastAutoTable?.finalY || startY;
    let currentY = finalY + 12;

    const totalsHeight = totals.length * 8 + 14;
    if (currentY + totalsHeight > pageHeight - 40) {
      doc.addPage();
      currentY = 25;
    }

    // صندوق الإجماليات
    doc.setFillColor(25, 77, 51);
    doc.setDrawColor(25, 77, 51);
    doc.setLineWidth(0.5);
    doc.roundedRect(12, currentY, pageWidth - 24, totalsHeight, 3, 3, "FD");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    
    totals.forEach((total, index) => {
      const y = currentY + 10 + index * 8;
      doc.text(total.label, 18, y);
      doc.text(String(total.value), pageWidth - 18, y, { align: "right" });
    });
  }

  // إضافة الختم
  await addStampToDoc(doc);

  // حفظ الملف
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
      fillColor: [25, 77, 51],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: { top: 5, bottom: 5, left: 3, right: 3 },
      lineWidth: 0.1,
      lineColor: [200, 200, 200],
    },
    
    bodyStyles: {
      fontSize: 10,
      textColor: [40, 40, 40],
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      lineWidth: 0.1,
      lineColor: [220, 220, 220],
    },
    
    alternateRowStyles: {
      fillColor: [248, 252, 249],
    },
    
    columnStyles: columnStyles,
    
    margin: { top: 10, left: 12, right: 12, bottom: 35 },
    
    tableLineColor: [200, 200, 200],
    tableLineWidth: 0.1,
    
    didDrawPage: (data) => {
      const footerY = pageHeight - 12;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(120, 120, 120);
      
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
    let currentY = finalY + 12;

    const totalsHeight = pdfOptions.totals.length * 8 + 14;
    if (currentY + totalsHeight > pageHeight - 40) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFillColor(25, 77, 51);
    doc.setDrawColor(25, 77, 51);
    doc.setLineWidth(0.5);
    doc.roundedRect(12, currentY, pageWidth - 24, totalsHeight, 3, 3, "FD");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    
    pdfOptions.totals.forEach((total, index) => {
      const y = currentY + 10 + index * 8;
      doc.text(total.label, 18, y);
      doc.text(String(total.value), pageWidth - 18, y, { align: "right" });
    });
  }

  // إضافة الختم
  await addStampToDoc(doc);

  // فتح نافذة الطباعة
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

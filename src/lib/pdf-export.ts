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
}

interface PDFData {
  [key: string]: string | number;
}

const LOGO_URL = "https://cdn.hercules.app/file_2EDW4ulZlmwarzzXHgYjO1Hv";

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
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
  
  let currentY = 15;

  try {
    // إضافة الشعار
    const logoData = await loadImage(LOGO_URL);
    const logoSize = 30;
    doc.addImage(logoData, "PNG", (pageWidth - logoSize) / 2, currentY, logoSize, logoSize);
    currentY += logoSize + 8;
  } catch (error) {
    console.error("Failed to load logo:", error);
    currentY += 5;
  }

  // العنوان الرئيسي
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(56, 115, 76);
  doc.text(header.title, pageWidth / 2, currentY, { align: "center" });
  currentY += 10;

  // العنوان الفرعي
  if (header.subtitle) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(header.subtitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  }

  // معلومات الفرع والتاريخ
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Branch: ${header.branchName}`, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  if (header.dateRange) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Period: ${header.dateRange.from} - ${header.dateRange.to}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 8;
  }

  // خط فاصل زخرفي
  doc.setDrawColor(56, 115, 76);
  doc.setLineWidth(0.8);
  doc.line(20, currentY, pageWidth - 20, currentY);
  currentY += 8;

  // الجدول مع تنسيق محسّن
  autoTable(doc, {
    startY: currentY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => String(row[col.dataKey] || "-"))),
    theme: "striped",
    headStyles: {
      fillColor: [56, 115, 76],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 4,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
    },
    margin: { top: 10, left: 15, right: 15, bottom: 30 },
    didDrawPage: (data) => {
      // تذييل الصفحة
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      doc.text(`Generated: ${dateStr} ${timeStr}`, 15, footerY);
      
      const docInternal = doc.internal as typeof doc.internal & { getCurrentPageInfo(): { pageNumber: number } };
      const pageInfo = docInternal.getCurrentPageInfo();
      const pageNum = pageInfo.pageNumber;
      const totalPages = (doc.internal as typeof doc.internal & { getNumberOfPages(): number }).getNumberOfPages();
      
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 15, footerY, { align: "right" });
    },
  });

  // الإجماليات في صندوق مميز
  if (totals && totals.length > 0) {
    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const finalY = docWithTable.lastAutoTable?.finalY || currentY;
    currentY = finalY + 10;

    // التأكد من أن الإجماليات لا تتجاوز الصفحة
    const totalsHeight = totals.length * 7 + 12;
    if (currentY + totalsHeight > pageHeight - 30) {
      doc.addPage();
      currentY = 20;
    }

    // صندوق الإجماليات
    doc.setFillColor(56, 115, 76);
    doc.roundedRect(15, currentY, pageWidth - 30, totalsHeight, 3, 3, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    
    totals.forEach((total, index) => {
      const y = currentY + 8 + index * 7;
      doc.text(total.label, 20, y);
      doc.text(String(total.value), pageWidth - 20, y, { align: "right" });
    });
  }

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
  
  let currentY = 15;

  try {
    // إضافة الشعار
    const logoData = await loadImage(LOGO_URL);
    const logoSize = 30;
    doc.addImage(logoData, "PNG", (pageWidth - logoSize) / 2, currentY, logoSize, logoSize);
    currentY += logoSize + 8;
  } catch (error) {
    console.error("Failed to load logo:", error);
    currentY += 5;
  }

  // العنوان الرئيسي
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(56, 115, 76);
  doc.text(pdfOptions.header.title, pageWidth / 2, currentY, { align: "center" });
  currentY += 10;

  // العنوان الفرعي
  if (pdfOptions.header.subtitle) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(pdfOptions.header.subtitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  }

  // معلومات الفرع والتاريخ
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`Branch: ${pdfOptions.header.branchName}`, pageWidth / 2, currentY, { align: "center" });
  currentY += 6;

  if (pdfOptions.header.dateRange) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Period: ${pdfOptions.header.dateRange.from} - ${pdfOptions.header.dateRange.to}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 8;
  }

  // خط فاصل زخرفي
  doc.setDrawColor(56, 115, 76);
  doc.setLineWidth(0.8);
  doc.line(20, currentY, pageWidth - 20, currentY);
  currentY += 8;

  // الجدول
  autoTable(doc, {
    startY: currentY,
    head: [pdfOptions.columns.map((col) => col.header)],
    body: pdfOptions.data.map((row) =>
      pdfOptions.columns.map((col) => String(row[col.dataKey] || "-"))
    ),
    theme: "striped",
    headStyles: {
      fillColor: [56, 115, 76],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
      valign: "middle",
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
      valign: "middle",
      cellPadding: 4,
      textColor: [40, 40, 40],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: "auto" },
    },
    margin: { top: 10, left: 15, right: 15, bottom: 30 },
    didDrawPage: (data) => {
      // تذييل الصفحة
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150);
      
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      
      doc.text(`Generated: ${dateStr} ${timeStr}`, 15, footerY);
      
      const docInternal = doc.internal as typeof doc.internal & { getCurrentPageInfo(): { pageNumber: number } };
      const pageInfo = docInternal.getCurrentPageInfo();
      const pageNum = pageInfo.pageNumber;
      const totalPages = (doc.internal as typeof doc.internal & { getNumberOfPages(): number }).getNumberOfPages();
      
      doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 15, footerY, { align: "right" });
    },
  });

  // الإجماليات
  if (pdfOptions.totals && pdfOptions.totals.length > 0) {
    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const finalY = docWithTable.lastAutoTable?.finalY || currentY;
    currentY = finalY + 10;

    // التأكد من أن الإجماليات لا تتجاوز الصفحة
    const totalsHeight = pdfOptions.totals.length * 7 + 12;
    if (currentY + totalsHeight > pageHeight - 30) {
      doc.addPage();
      currentY = 20;
    }

    // صندوق الإجماليات
    doc.setFillColor(56, 115, 76);
    doc.roundedRect(15, currentY, pageWidth - 30, totalsHeight, 3, 3, "F");
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    
    pdfOptions.totals.forEach((total, index) => {
      const y = currentY + 8 + index * 7;
      doc.text(total.label, 20, y);
      doc.text(String(total.value), pageWidth - 20, y, { align: "right" });
    });
  }

  // فتح نافذة الطباعة
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

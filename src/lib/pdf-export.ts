import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// تحميل الخط العربي
const arabicFont = "amiri";

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

export function generatePDF({
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
  
  // إضافة الشعار في الأعلى (إذا كان متوفراً)
  // يمكن استبدال هذا بشعار الشركة الفعلي
  const logoUrl = "https://cdn.hercules.app/file_X3jdTiCKmUjHC4szRS5CixU4";
  
  let currentY = 20;

  // العنوان الرئيسي
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(header.title, pageWidth / 2, currentY, { align: "center" });
  currentY += 10;

  // العنوان الفرعي
  if (header.subtitle) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(header.subtitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  }

  // اسم الفرع
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Branch: ${header.branchName}`, pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 8;

  // الفترة الزمنية
  if (header.dateRange) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Period: ${header.dateRange.from} to ${header.dateRange.to}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 10;
  }

  // خط فاصل
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 5;

  // الجدول
  autoTable(doc, {
    startY: currentY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => row[col.dataKey])),
    theme: "grid",
    headStyles: {
      fillColor: [86, 115, 76], // لون أخضر داكن
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10, left: 15, right: 15 },
  });

  // الإجماليات
  if (totals && totals.length > 0) {
    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const finalY = docWithTable.lastAutoTable?.finalY || currentY;
    currentY = finalY + 10;

    // مستطيل للإجماليات
    doc.setFillColor(240, 240, 240);
    doc.rect(15, currentY, pageWidth - 30, totals.length * 8 + 5, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    totals.forEach((total, index) => {
      const y = currentY + 5 + index * 8;
      doc.text(total.label, 20, y);
      doc.text(String(total.value), pageWidth - 20, y, { align: "right" });
    });
  }

  // تذييل الصفحة
  const docInternal = doc.internal as typeof doc.internal & { getNumberOfPages(): number };
  const pageCount = docInternal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    
    // التاريخ والوقت
    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-SA");
    const timeStr = now.toLocaleTimeString("ar-SA");
    
    doc.text(`Generated: ${dateStr} ${timeStr}`, 15, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, {
      align: "right",
    });
  }

  // حفظ الملف
  doc.save(`${fileName}.pdf`);
}

export function printPDF(pdfOptions: Parameters<typeof generatePDF>[0]) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  let currentY = 20;

  // العنوان الرئيسي
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(pdfOptions.header.title, pageWidth / 2, currentY, { align: "center" });
  currentY += 10;

  // العنوان الفرعي
  if (pdfOptions.header.subtitle) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(pdfOptions.header.subtitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;
  }

  // اسم الفرع
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Branch: ${pdfOptions.header.branchName}`, pageWidth / 2, currentY, {
    align: "center",
  });
  currentY += 8;

  // الفترة الزمنية
  if (pdfOptions.header.dateRange) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Period: ${pdfOptions.header.dateRange.from} to ${pdfOptions.header.dateRange.to}`,
      pageWidth / 2,
      currentY,
      { align: "center" }
    );
    currentY += 10;
  }

  // خط فاصل
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);
  currentY += 5;

  // الجدول
  autoTable(doc, {
    startY: currentY,
    head: [pdfOptions.columns.map((col) => col.header)],
    body: pdfOptions.data.map((row) =>
      pdfOptions.columns.map((col) => row[col.dataKey])
    ),
    theme: "grid",
    headStyles: {
      fillColor: [86, 115, 76],
      textColor: [255, 255, 255],
      fontSize: 11,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 10,
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 10, left: 15, right: 15 },
  });

  // الإجماليات
  if (pdfOptions.totals && pdfOptions.totals.length > 0) {
    const docWithTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
    const finalY = docWithTable.lastAutoTable?.finalY || currentY;
    currentY = finalY + 10;

    doc.setFillColor(240, 240, 240);
    doc.rect(15, currentY, pageWidth - 30, pdfOptions.totals.length * 8 + 5, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    pdfOptions.totals.forEach((total, index) => {
      const y = currentY + 5 + index * 8;
      doc.text(total.label, 20, y);
      doc.text(String(total.value), pageWidth - 20, y, { align: "right" });
    });
  }

  // تذييل الصفحة
  const docInternal = doc.internal as typeof doc.internal & { getNumberOfPages(): number };
  const pageCount = docInternal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150);
    
    const now = new Date();
    const dateStr = now.toLocaleDateString("ar-SA");
    const timeStr = now.toLocaleTimeString("ar-SA");
    
    doc.text(`Generated: ${dateStr} ${timeStr}`, 15, pageHeight - 10);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 10, {
      align: "right",
    });
  }

  // فتح نافذة الطباعة
  doc.autoPrint();
  window.open(doc.output("bloburl"), "_blank");
}

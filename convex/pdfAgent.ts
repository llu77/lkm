"use node";

import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

/**
 * PDF.co Agent - Advanced PDF Generation
 * 
 * Capabilities:
 * - Generate PDFs from HTML
 * - Generate PDFs from templates
 * - Merge multiple PDFs
 * - Add watermarks
 * - Convert documents to PDF
 */

// PDF.co API Base URL
const PDFCO_API_BASE = "https://api.pdf.co/v1";

/**
 * Generate PDF from HTML using PDF.co
 */
export const generatePDFFromHTML = action({
  args: {
    html: v.string(),
    documentName: v.string(),
    margins: v.optional(v.object({
      top: v.number(),
      right: v.number(),
      bottom: v.number(),
      left: v.number(),
    })),
    pageSize: v.optional(v.string()), // A4, Letter, etc
    orientation: v.optional(v.string()), // portrait, landscape
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.PDFCO_API_KEY;
    
    if (!apiKey) {
      throw new Error("PDFCO_API_KEY not configured in environment variables");
    }

    try {
      // Prepare request
      const requestBody = {
        html: args.html,
        name: args.documentName,
        margins: args.margins || "10mm 10mm 10mm 10mm",
        paperSize: args.pageSize || "A4",
        orientation: args.orientation || "Portrait",
        async: false,
      };

      // Call PDF.co API
      const response = await fetch(`${PDFCO_API_BASE}/pdf/convert/from/html`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF.co API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (!result.url) {
        throw new Error("PDF.co did not return a PDF URL");
      }

      return {
        success: true,
        pdfUrl: result.url,
        fileName: args.documentName,
        pages: result.pageCount || 1,
        message: "PDF generated successfully",
      };
    } catch (error) {
      console.error("PDF.co generation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to generate PDF",
      };
    }
  },
});

/**
 * Generate Revenue Report PDF using PDF.co
 */
export const generateRevenueReportPDF: ReturnType<typeof action> = action({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    revenues: v.array(v.object({
      date: v.number(),
      cash: v.number(),
      network: v.number(),
      budget: v.number(),
      total: v.number(),
      calculatedTotal: v.number(),
      isMatched: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    // Generate HTML for the report
    const html = generateRevenueHTML(args);
    
    // Use PDF.co to generate PDF
    const result: { success: boolean; pdfUrl?: string; error?: string } = await ctx.runAction(api.pdfAgent.generatePDFFromHTML, {
      html,
      documentName: `revenue_report_${args.branchId}_${new Date().toISOString()}.pdf`,
      pageSize: "A4",
      orientation: "landscape",
    });

    return result;
  },
});

/**
 * Generate Expense Report PDF using PDF.co
 */
export const generateExpenseReportPDF: ReturnType<typeof action> = action({
  args: {
    branchId: v.string(),
    branchName: v.string(),
    startDate: v.number(),
    endDate: v.number(),
    expenses: v.array(v.object({
      date: v.number(),
      title: v.string(),
      amount: v.number(),
      category: v.string(),
      description: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    // Generate HTML for the report
    const html = generateExpenseHTML(args);
    
    // Use PDF.co to generate PDF
    const result: { success: boolean; pdfUrl?: string; error?: string } = await ctx.runAction(api.pdfAgent.generatePDFFromHTML, {
      html,
      documentName: `expense_report_${args.branchId}_${new Date().toISOString()}.pdf`,
      pageSize: "A4",
      orientation: "portrait",
    });

    return result;
  },
});

/**
 * Generate Product Order Invoice PDF using PDF.co
 */
export const generateProductOrderPDF: ReturnType<typeof action> = action({
  args: {
    orderId: v.string(),
    orderName: v.string(),
    branchName: v.string(),
    employeeName: v.string(),
    products: v.array(v.object({
      productName: v.string(),
      quantity: v.number(),
      price: v.number(),
      total: v.number(),
    })),
    grandTotal: v.number(),
    status: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Generate HTML for the invoice
    const html = generateProductOrderHTML(args);
    
    // Use PDF.co to generate PDF
    const result: { success: boolean; pdfUrl?: string; error?: string } = await ctx.runAction(api.pdfAgent.generatePDFFromHTML, {
      html,
      documentName: `product_order_${args.orderId}.pdf`,
      pageSize: "A4",
      orientation: "portrait",
    });

    return result;
  },
});

/**
 * Test PDF.co Connection
 */
export const testPDFcoConnection = action({
  args: {},
  handler: async (ctx) => {
    const apiKey = process.env.PDFCO_API_KEY;
    
    if (!apiKey) {
      return {
        success: false,
        message: "PDFCO_API_KEY not configured",
        configured: false,
      };
    }

    try {
      // Simple test: generate a hello world PDF
      const testHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #3B82F6; }
          </style>
        </head>
        <body>
          <h1>PDF.co Test Successful! ✅</h1>
          <p>Your PDF.co integration is working correctly.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </body>
        </html>
      `;

      const response = await fetch(`${PDFCO_API_BASE}/pdf/convert/from/html`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: testHTML,
          name: "test.pdf",
          async: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        message: "PDF.co connection successful",
        configured: true,
        testPdfUrl: result.url,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
        configured: true,
      };
    }
  },
});

// ============ HTML Generators ============

function generateRevenueHTML(args: {
  branchName: string;
  startDate: number;
  endDate: number;
  revenues: Array<{
    date: number;
    cash: number;
    network: number;
    budget: number;
    total: number;
    calculatedTotal: number;
    isMatched: boolean;
  }>;
}): string {
  const totals = args.revenues.reduce(
    (acc, r) => ({
      cash: acc.cash + r.cash,
      network: acc.network + r.network,
      budget: acc.budget + r.budget,
      total: acc.total + r.total,
      calculatedTotal: acc.calculatedTotal + r.calculatedTotal,
    }),
    { cash: 0, network: 0, budget: 0, total: 0, calculatedTotal: 0 }
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          direction: rtl; 
          padding: 20px;
        }
        h1 { 
          color: #3B82F6; 
          text-align: center;
          border-bottom: 3px solid #3B82F6;
          padding-bottom: 10px;
        }
        .info { 
          background: #F1F5F9; 
          padding: 15px; 
          border-radius: 8px;
          margin: 20px 0;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th, td { 
          border: 1px solid #CBD5E1; 
          padding: 10px; 
          text-align: center;
        }
        th { 
          background: #3B82F6; 
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { background: #F8FAFC; }
        .total-row { 
          background: #DBEAFE !important; 
          font-weight: bold;
        }
        .matched { color: #10B981; font-weight: bold; }
        .not-matched { color: #EF4444; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>تقرير الإيرادات</h1>
      <div class="info">
        <p><strong>الفرع:</strong> ${args.branchName}</p>
        <p><strong>الفترة:</strong> ${new Date(args.startDate).toLocaleDateString('ar-EG')} - ${new Date(args.endDate).toLocaleDateString('ar-EG')}</p>
        <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>نقدي</th>
            <th>شبكة</th>
            <th>ميزانية</th>
            <th>الإجمالي</th>
            <th>الإجمالي المحسوب</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${args.revenues.map(r => `
            <tr>
              <td>${new Date(r.date).toLocaleDateString('ar-EG')}</td>
              <td>${r.cash.toFixed(2)}</td>
              <td>${r.network.toFixed(2)}</td>
              <td>${r.budget.toFixed(2)}</td>
              <td style="font-weight: bold">${r.total.toFixed(2)}</td>
              <td>${r.calculatedTotal.toFixed(2)}</td>
              <td class="${r.isMatched ? 'matched' : 'not-matched'}">
                ${r.isMatched ? '✓' : '✗'}
              </td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td>الإجمالي</td>
            <td>${totals.cash.toFixed(2)}</td>
            <td>${totals.network.toFixed(2)}</td>
            <td>${totals.budget.toFixed(2)}</td>
            <td>${totals.total.toFixed(2)}</td>
            <td>${totals.calculatedTotal.toFixed(2)}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function generateExpenseHTML(args: {
  branchName: string;
  startDate: number;
  endDate: number;
  expenses: Array<{
    date: number;
    title: string;
    amount: number;
    category: string;
    description?: string;
  }>;
}): string {
  const total = args.expenses.reduce((acc, e) => acc + e.amount, 0);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          direction: rtl; 
          padding: 20px;
        }
        h1 { 
          color: #EF4444; 
          text-align: center;
          border-bottom: 3px solid #EF4444;
          padding-bottom: 10px;
        }
        .info { 
          background: #FEF2F2; 
          padding: 15px; 
          border-radius: 8px;
          margin: 20px 0;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th, td { 
          border: 1px solid #FCA5A5; 
          padding: 10px; 
          text-align: right;
        }
        th { 
          background: #EF4444; 
          color: white;
          font-weight: bold;
          text-align: center;
        }
        tr:nth-child(even) { background: #FEF2F2; }
        .total-row { 
          background: #FEE2E2 !important; 
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>تقرير المصروفات</h1>
      <div class="info">
        <p><strong>الفرع:</strong> ${args.branchName}</p>
        <p><strong>الفترة:</strong> ${new Date(args.startDate).toLocaleDateString('ar-EG')} - ${new Date(args.endDate).toLocaleDateString('ar-EG')}</p>
        <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>التاريخ</th>
            <th>العنوان</th>
            <th>الفئة</th>
            <th>الوصف</th>
            <th>المبلغ</th>
          </tr>
        </thead>
        <tbody>
          ${args.expenses.map(e => `
            <tr>
              <td style="text-align: center">${new Date(e.date).toLocaleDateString('ar-EG')}</td>
              <td>${e.title}</td>
              <td style="text-align: center">${e.category}</td>
              <td>${e.description || '-'}</td>
              <td style="text-align: center; font-weight: bold">${e.amount.toFixed(2)} ر.س</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="4" style="text-align: center">الإجمالي</td>
            <td style="text-align: center">${total.toFixed(2)} ر.س</td>
          </tr>
        </tbody>
      </table>
    </body>
    </html>
  `;
}

function generateProductOrderHTML(args: {
  orderId: string;
  orderName: string;
  branchName: string;
  employeeName: string;
  products: Array<{
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  grandTotal: number;
  status: string;
  notes?: string;
}): string {
  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    approved: '#10B981',
    rejected: '#EF4444',
    completed: '#3B82F6',
  };
  
  const statusColor = statusColors[args.status] || '#6B7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          direction: rtl; 
          padding: 20px;
        }
        h1 { 
          color: #1F2937; 
          text-align: center;
          border-bottom: 3px solid #3B82F6;
          padding-bottom: 10px;
        }
        .header { 
          background: #F9FAFB; 
          padding: 20px; 
          border-radius: 8px;
          margin: 20px 0;
          border-right: 4px solid ${statusColor};
        }
        .status {
          display: inline-block;
          padding: 5px 15px;
          background: ${statusColor};
          color: white;
          border-radius: 4px;
          font-weight: bold;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th, td { 
          border: 1px solid #E5E7EB; 
          padding: 12px; 
          text-align: center;
        }
        th { 
          background: #1F2937; 
          color: white;
          font-weight: bold;
        }
        tr:nth-child(even) { background: #F9FAFB; }
        .total-row { 
          background: #DBEAFE !important; 
          font-weight: bold;
          font-size: 1.1em;
        }
        .notes {
          background: #FEF3C7;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-right: 4px solid #F59E0B;
        }
      </style>
    </head>
    <body>
      <h1>فاتورة طلب منتجات</h1>
      
      <div class="header">
        <p><strong>رقم الطلب:</strong> ${args.orderId}</p>
        <p><strong>اسم الطلب:</strong> ${args.orderName}</p>
        <p><strong>الفرع:</strong> ${args.branchName}</p>
        <p><strong>الموظف:</strong> ${args.employeeName}</p>
        <p><strong>التاريخ:</strong> ${new Date().toLocaleDateString('ar-EG')} ${new Date().toLocaleTimeString('ar-EG')}</p>
        <p><strong>الحالة:</strong> <span class="status">${args.status}</span></p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>السعر</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${args.products.map(p => `
            <tr>
              <td style="text-align: right">${p.productName}</td>
              <td>${p.quantity}</td>
              <td>${p.price.toFixed(2)} ر.س</td>
              <td style="font-weight: bold">${p.total.toFixed(2)} ر.س</td>
            </tr>
          `).join('')}
          <tr class="total-row">
            <td colspan="3" style="text-align: center">الإجمالي الكلي</td>
            <td>${args.grandTotal.toFixed(2)} ر.س</td>
          </tr>
        </tbody>
      </table>
      
      ${args.notes ? `
        <div class="notes">
          <strong>ملاحظات:</strong>
          <p>${args.notes}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

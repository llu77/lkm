// Removed "use node" directive - not needed for this action
// Convex will automatically handle Node.js context when needed

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

type PayrollRecordDoc = Doc<"payrollRecords">;
type PayrollEmployee = PayrollRecordDoc["employees"][number];

/**
 * إرسال إيميل مسير الرواتب للمشرف
 * يتم استدعاؤها تلقائياً بعد توليد مسير الرواتب
 */
export const sendPayrollEmail = action({
  args: {
    payrollId: v.id("payrollRecords"),
    supervisorEmail: v.string(),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: true; emailId: string } | never> => {
    // Get payroll data
    const payroll = await ctx.runQuery(internal.payroll.getPayrollData, {
      payrollId: args.payrollId,
    });

    if (!payroll) {
      throw new Error("Payroll record not found");
    }

    const employees: PayrollEmployee[] = payroll.employees ?? [];

    // تحويل رقم الشهر إلى اسم بالعربية
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthName = arabicMonths[payroll.month - 1];

    // تنسيق الأرقام
    const formatNumber = (num: number) => {
      return new Intl.NumberFormat('ar-SA', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    // بناء جدول الموظفين
    let employeesTableRows = '';
    employees.forEach((emp, index) => {
      const grossSalary = emp.baseSalary + emp.supervisorAllowance + emp.incentives;
      employeesTableRows += `
        <tr style="${index % 2 === 0 ? 'background-color: #f8fafc;' : ''}">
          <td style="padding: 12px; text-align: center; border: 1px solid #e2e8f0;">${index + 1}</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${emp.employeeName}</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${formatNumber(grossSalary)}</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${formatNumber(emp.totalAdvances)}</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0;">${formatNumber(emp.totalDeductions)}</td>
          <td style="padding: 12px; text-align: right; border: 1px solid #e2e8f0; font-weight: bold; color: #1565c0;">${formatNumber(emp.netSalary)}</td>
        </tr>
      `;
    });

    // بناء HTML للإيميل
    const emailHtml = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>مسير الرواتب - ${monthName} ${payroll.year}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f4f8; margin: 0; padding: 20px;">
        <div style="max-width: 800px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💼 مسير رواتب ${monthName} ${payroll.year}</h1>
            <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 16px;">الفرع: ${payroll.branchName}</p>
          </div>

          <!-- Content -->
          <div style="padding: 40px;">

            <!-- Greeting -->
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
              ${payroll.supervisorName ? `عزيزي المشرف ${payroll.supervisorName}،` : 'السلام عليكم ورحمة الله وبركاته،'}
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #334155; margin-bottom: 30px;">
              يسرنا إبلاغكم بأنه تم إنشاء مسير رواتب ${monthName} ${payroll.year} بنجاح. فيما يلي ملخص تفصيلي:
            </p>

            <!-- Summary Box -->
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-right: 5px solid #1e88e5;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px;">
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 0; color: #64b5f6; font-size: 14px; font-weight: 600;">عدد الموظفين</p>
                    <p style="margin: 5px 0 0 0; color: #1565c0; font-size: 28px; font-weight: bold;">${employees.length}</p>
                </div>
                <div style="flex: 1; min-width: 200px;">
                  <p style="margin: 0; color: #64b5f6; font-size: 14px; font-weight: 600;">إجمالي صافي الرواتب</p>
                  <p style="margin: 5px 0 0 0; color: #1565c0; font-size: 28px; font-weight: bold;">${formatNumber(payroll.totalNetSalary)} ريال</p>
                </div>
              </div>
            </div>

            <!-- Employees Table -->
            <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e2e8f0;">
              🧑‍💼 تفاصيل الموظفين
            </h2>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px;">
                <thead>
                  <tr style="background: linear-gradient(135deg, #64b5f6 0%, #42a5f5 100%);">
                    <th style="padding: 14px; text-align: center; border: 1px solid #1e88e5; color: white; font-weight: bold;">#</th>
                    <th style="padding: 14px; text-align: right; border: 1px solid #1e88e5; color: white; font-weight: bold;">اسم الموظف</th>
                    <th style="padding: 14px; text-align: right; border: 1px solid #1e88e5; color: white; font-weight: bold;">الإجمالي</th>
                    <th style="padding: 14px; text-align: right; border: 1px solid #1e88e5; color: white; font-weight: bold;">السلف</th>
                    <th style="padding: 14px; text-align: right; border: 1px solid #1e88e5; color: white; font-weight: bold;">الخصومات</th>
                    <th style="padding: 14px; text-align: right; border: 1px solid #1e88e5; color: white; font-weight: bold;">الصافي</th>
                  </tr>
                </thead>
                <tbody>
                  ${employeesTableRows}
                </tbody>
                <tfoot>
                  <tr style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); font-weight: bold;">
                    <td colspan="5" style="padding: 14px; text-align: right; border: 1px solid #1e88e5; font-size: 16px; color: #1565c0;">
                      المجموع الكلي
                    </td>
                    <td style="padding: 14px; text-align: right; border: 1px solid #1e88e5; font-size: 18px; color: #0d47a1;">
                      ${formatNumber(payroll.totalNetSalary)} ريال
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <!-- Instructions Box -->
            <div style="background: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <h3 style="color: #856404; margin: 0 0 10px 0; font-size: 16px;">
                ⚡ تعليمات هامة:
              </h3>
              <ul style="margin: 0; padding-right: 20px; color: #856404; line-height: 1.8;">
                <li>يرجى مراجعة بيانات الموظفين والتأكد من صحتها</li>
                <li>التأكد من توافر السيولة الكافية قبل الصرف</li>
                <li>توثيق استلام كل موظف لراتبه بالتوقيع</li>
                <li>في حالة وجود أي استفسارات، يرجى التواصل مع إدارة الموارد البشرية</li>
              </ul>
            </div>

            <!-- Action Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.VITE_APP_URL || 'https://your-app-url.com'}/payroll"
                 style="display: inline-block; background: linear-gradient(135deg, #1e88e5 0%, #1565c0 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                📄 عرض مسير الرواتب الكامل
              </a>
            </div>

          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 25px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #64748b; font-size: 13px;">
              تم إنشاء هذا التقرير تلقائياً من نظام الإدارة المالية
            </p>
            <p style="margin: 10px 0 0 0; color: #94a3b8; font-size: 12px;">
              © ${payroll.year} نظام الإدارة المالية. جميع الحقوق محفوظة.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    // إرسال الإيميل
    try {
      const result = await ctx.runAction(api.emailSystem.sendEmail, {
        to: [args.supervisorEmail],
        subject: `💼 مسير رواتب ${monthName} ${payroll.year} - ${payroll.branchName}`,
        html: emailHtml,
        from: "نظام الإدارة المالية <payroll@resend.dev>",
      });

      // تحديث حالة الإيميل في payroll record
      await ctx.runMutation(api.payroll.markEmailSent, {
        payrollId: args.payrollId,
      });

      return { success: true, emailId: result.emailId };
    } catch (error) {
      console.error("Failed to send payroll email:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "فشل في إرسال إيميل مسير الرواتب"
      );
    }
  },
});

// Note: getPayrollData moved to payroll.ts as an internalQuery
// because "use node" files can only contain actions, not queries

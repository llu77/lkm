"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * إرسال إيميل عند تغيير حالة طلب الموظف
 */
export const sendRequestStatusEmail = internalAction({
  args: {
    employeeEmail: v.string(),
    employeeName: v.string(),
    requestType: v.string(),
    status: v.string(),
    branchName: v.string(),
    adminResponse: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // تحديد العنوان والرسالة حسب الحالة
    let subject = "";
    let statusText = "";
    let statusColor = "";

    if (args.status === "مقبول") {
      subject = `تم قبول طلب ${args.requestType}`;
      statusText = "مقبول ✓";
      statusColor = "#10b981"; // green
    } else if (args.status === "مرفوض") {
      subject = `تم رفض طلب ${args.requestType}`;
      statusText = "مرفوض ✗";
      statusColor = "#ef4444"; // red
    } else {
      return; // لا نرسل إيميل للطلبات تحت الإجراء
    }

    // بناء HTML للإيميل
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">تحديث حالة الطلب</h1>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 30px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          عزيزي/عزيزتي <strong>${args.employeeName}</strong>،
        </p>

        <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
          نود إعلامك بأن طلبك <strong>${args.requestType}</strong> قد تم مراجعته.
        </p>

        <!-- Status Box -->
        <div style="background-color: #f9fafb; border-right: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">الحالة الجديدة:</p>
          <p style="margin: 10px 0 0 0; font-size: 20px; font-weight: bold; color: ${statusColor};">
            ${statusText}
          </p>
        </div>

        ${args.adminResponse ? `
        <!-- Admin Response -->
        <div style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #92400e; font-weight: bold;">رد الإدارة:</p>
          <p style="margin: 0; font-size: 14px; color: #78350f; white-space: pre-wrap;">${args.adminResponse}</p>
        </div>
        ` : ''}

        <!-- Branch Info -->
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
            <strong>الفرع:</strong> ${args.branchName}
          </p>
          <p style="font-size: 14px; color: #6b7280; margin: 5px 0;">
            <strong>نوع الطلب:</strong> ${args.requestType}
          </p>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          في حال وجود أي استفسار، يرجى التواصل مع المشرف المباشر.
        </p>

        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
          مع تحيات،<br>
          <strong>إدارة ${args.branchName}</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          هذه رسالة تلقائية، يرجى عدم الرد على هذا البريد الإلكتروني.
        </p>
        <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0 0;">
          © ${new Date().getFullYear()} نظام إدارة الموارد البشرية
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    try {
      // إرسال الإيميل
      await ctx.runAction(internal.emailSystem.sendEmailInternal, {
        to: [args.employeeEmail],
        subject,
        html,
        from: "طلبات الموظفين <requests@company.com>",
      });

      console.log(`✅ تم إرسال إيميل حالة الطلب إلى: ${args.employeeEmail}`);
    } catch (error) {
      console.error("❌ فشل إرسال إيميل حالة الطلب:", error);
      throw error;
    }
  },
});

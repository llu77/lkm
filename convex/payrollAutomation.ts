/**
 * Payroll Automation Agent
 * 
 * يعمل بشكل تلقائي كل شهر في تاريخ 1 @ 4:00 AM
 * يقوم بـ:
 * 1. إنشاء مسير رواتب لجميع الفروع
 * 2. إنشاء PDF احترافي
 * 3. إرسال بريد إلكتروني
 * 4. إنشاء نسخة احتياطية
 * 5. إرسال webhook لـ Zapier
 */

import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

/**
 * Generate monthly payroll for all branches
 * يُستدعى من Zapier Schedule في تاريخ 1 @ 4:00 AM
 */
export const generateMonthlyPayrollForAllBranches = internalMutation({
  args: {
    month: v.optional(v.number()), // 1-12 (optional, defaults to last month)
    year: v.optional(v.number()),  // YYYY (optional, defaults to current year)
  },
  handler: async (ctx, args) => {
    const now = new Date();
    
    // Default to last month
    const targetMonth = args.month || (now.getMonth() === 0 ? 12 : now.getMonth());
    const targetYear = args.year || (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear());
    
    console.log(`🚀 Starting monthly payroll generation for ${targetMonth}/${targetYear}`);
    
    // Get all active employees grouped by branch
    const allEmployees = await ctx.db.query("employees")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    if (allEmployees.length === 0) {
      console.log("⚠️ No active employees found");
      return {
        success: false,
        message: "لا يوجد موظفون نشطون",
        generated: [],
      };
    }
    
    // Group employees by branch
    const branchGroups: Record<string, typeof allEmployees> = {};
    for (const emp of allEmployees) {
      if (!branchGroups[emp.branchId]) {
        branchGroups[emp.branchId] = [];
      }
      branchGroups[emp.branchId].push(emp);
    }
    
    console.log(`📊 Found ${Object.keys(branchGroups).length} branches with active employees`);
    
    const generatedPayrolls: Array<{
      branchId: string;
      branchName: string;
      payrollId: string;
      employeeCount: number;
      totalNetSalary: number;
    }> = [];
    
    // Generate payroll for each branch
    for (const [branchId, employees] of Object.entries(branchGroups)) {
      try {
        console.log(`💼 Processing branch: ${employees[0].branchName} (${employees.length} employees)`);
        
        // Get advances and deductions for this month
        const employeeDataWithCalculations = await Promise.all(
          employees.map(async (emp) => {
            // Get advances for this employee in this month
            const advances = await ctx.db
              .query("advances")
              .withIndex("by_employee_month", (q) =>
                q.eq("employeeId", emp._id)
                 .eq("year", targetYear)
                 .eq("month", targetMonth)
              )
              .collect();
            
            const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
            
            // Get deductions for this employee in this month
            const deductions = await ctx.db
              .query("deductions")
              .withIndex("by_employee_month", (q) =>
                q.eq("employeeId", emp._id)
                 .eq("year", targetYear)
                 .eq("month", targetMonth)
              )
              .collect();
            
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
            
            // Calculate net salary
            const netSalary = emp.baseSalary + emp.supervisorAllowance + emp.incentives - totalAdvances - totalDeductions;
            
            return {
              employeeId: emp._id,
              employeeName: emp.employeeName,
              nationalId: emp.nationalId,
              baseSalary: emp.baseSalary,
              supervisorAllowance: emp.supervisorAllowance,
              incentives: emp.incentives,
              totalAdvances,
              totalDeductions,
              netSalary,
            };
          })
        );
        
        const totalNetSalary = employeeDataWithCalculations.reduce((sum, e) => sum + e.netSalary, 0);
        
        // Create payroll record
        const payrollId = await ctx.db.insert("payrollRecords", {
          branchId,
          branchName: employees[0].branchName,
          month: targetMonth,
          year: targetYear,
          employees: employeeDataWithCalculations,
          totalNetSalary,
          generatedAt: Date.now(),
          generatedBy: employees[0].createdBy, // Use first employee's creator as generator
          emailSent: false,
        });
        
        console.log(`✅ Created payroll ${payrollId} for ${employees[0].branchName}`);
        
        generatedPayrolls.push({
          branchId,
          branchName: employees[0].branchName,
          payrollId,
          employeeCount: employees.length,
          totalNetSalary,
        });
        
      } catch (error) {
        console.error(`❌ Error generating payroll for branch ${branchId}:`, error);
      }
    }
    
    console.log(`🎉 Successfully generated ${generatedPayrolls.length} payroll records`);
    
    // Schedule follow-up actions
    if (generatedPayrolls.length > 0) {
      // Generate PDFs and send emails
      await ctx.scheduler.runAfter(
        60 * 1000, // 1 minute later
        internal.payrollAutomation.sendMonthlyPayrollEmails,
        {
          month: targetMonth,
          year: targetYear,
          payrollIds: generatedPayrolls.map(p => p.payrollId) as unknown as Array<Id<"payrollRecords">>,
        }
      );
      
      // Create backup
      await ctx.scheduler.runAfter(
        2 * 60 * 1000, // 2 minutes later
        internal.backup.index.createManualBackup,
        {
          reason: `نسخة احتياطية تلقائية بعد مسير رواتب ${targetMonth}/${targetYear}`,
        }
      );
    }
    
    return {
      success: true,
      message: `تم إنشاء ${generatedPayrolls.length} مسير رواتب بنجاح`,
      generated: generatedPayrolls,
      month: targetMonth,
      year: targetYear,
    };
  },
});

/**
 * Send monthly payroll emails
 * Generates PDFs and sends emails with payroll details
 */
export const sendMonthlyPayrollEmails = internalAction({
  args: {
    month: v.number(),
    year: v.number(),
    payrollIds: v.array(v.id("payrollRecords")),
  },
  handler: async (ctx, args) => {
    console.log(`📧 Starting email sending for ${args.payrollIds.length} payrolls`);
    
    // Get email settings
    const settings = await ctx.runQuery(api.emailSettings.getAllSettings, {});
    const senderName = settings.senderName || "نظام الإدارة المالية";
    const senderEmail = settings.senderEmail || "onboarding@resend.dev";
    const defaultRecipients = (settings.defaultRecipients as string[]) || [];
    
    const monthNames = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    
    let successCount = 0;
    let failCount = 0;
    
    for (const payrollId of args.payrollIds) {
      try {
        // Generate PDF
        console.log(`📄 Generating PDF for payroll ${payrollId}`);
        const pdfResult = await ctx.runAction(api.pdfAgent.generatePayrollPDF, {
          payrollId,
        });
        
        if (!pdfResult.success || !pdfResult.url) {
          console.error(`❌ Failed to generate PDF for ${payrollId}`);
          failCount++;
          continue;
        }
        
        // Get payroll data
        const payrollRecords = await ctx.runQuery(api.payroll.listPayrollRecords, {});
        const payroll = payrollRecords.find((p: Doc<"payrollRecords">) => p._id === payrollId);
        
        if (!payroll) {
          console.error(`❌ Payroll ${payrollId} not found`);
          failCount++;
          continue;
        }
        
        // Send email
        console.log(`📧 Sending email for payroll ${payrollId}`);
        const emailResult = await ctx.runAction(api.emailSystem.sendEmail, {
          from: `${senderName} <${senderEmail}>`,
          to: defaultRecipients.length > 0 ? defaultRecipients : ["admin@example.com"],
          subject: `مسير رواتب ${payroll.branchName} - ${monthNames[args.month - 1]} ${args.year}`,
          html: `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
              <meta charset="UTF-8">
              <style>
                body {
                  font-family: Arial, sans-serif;
                  direction: rtl;
                  padding: 20px;
                  background: #f5f5f5;
                }
                .container {
                  max-width: 600px;
                  margin: 0 auto;
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .header {
                  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
                  padding: 30px;
                  text-align: center;
                  color: white;
                }
                .logo {
                  font-size: 32px;
                  font-weight: bold;
                  margin-bottom: 10px;
                }
                .content {
                  padding: 30px;
                }
                .info-box {
                  background: #f8fafc;
                  padding: 20px;
                  border-radius: 8px;
                  margin: 20px 0;
                  border-right: 4px solid #2563eb;
                }
                .info-item {
                  margin: 10px 0;
                  font-size: 16px;
                }
                .info-label {
                  font-weight: bold;
                  color: #475569;
                }
                .info-value {
                  color: #1a1a1a;
                  font-weight: 600;
                }
                .button {
                  display: inline-block;
                  background: #2563eb;
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 5px;
                  margin: 20px 0;
                }
                .footer {
                  background: #f8fafc;
                  padding: 20px;
                  text-align: center;
                  color: #64748b;
                  font-size: 12px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="logo">⚡ Symbol AI</div>
                  <h2>مسير رواتب الموظفين</h2>
                </div>
                
                <div class="content">
                  <p>السلام عليكم ورحمة الله وبركاته،</p>
                  
                  <p>نحيطكم علماً بأنه تم إنشاء مسير رواتب الموظفين للشهر الماضي.</p>
                  
                  <div class="info-box">
                    <div class="info-item">
                      <span class="info-label">الفرع:</span>
                      <span class="info-value">${payroll.branchName}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">الشهر:</span>
                      <span class="info-value">${monthNames[args.month - 1]} ${args.year}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">عدد الموظفين:</span>
                      <span class="info-value">${payroll.employees.length} موظف</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">إجمالي الرواتب:</span>
                      <span class="info-value" style="color: #059669; font-size: 18px;">${payroll.totalNetSalary.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                  
                  <p>يمكنك تحميل ملف PDF الكامل من الرابط أدناه:</p>
                  
                  <div style="text-align: center;">
                    <a href="${pdfResult.url}" class="button">تحميل مسير الرواتب (PDF)</a>
                  </div>
                  
                  <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
                    تم إنشاء هذا المسير تلقائياً بواسطة Symbol AI في ${new Date().toLocaleDateString('ar-EG')}.
                  </p>
                </div>
                
                <div class="footer">
                  <p>© ${args.year} Symbol AI - نظام الإدارة المالية</p>
                  <p>هذا بريد تلقائي، يُرجى عدم الرد عليه</p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        
        if (emailResult.success) {
          // Mark email as sent
          await ctx.runMutation(api.payroll.updatePayrollEmailStatus, {
            payrollId,
            emailSent: true,
            pdfUrl: pdfResult.url,
          });
          
          console.log(`✅ Email sent successfully for ${payroll.branchName}`);
          successCount++;
        } else {
          console.error(`❌ Failed to send email for ${payroll.branchName}`);
          failCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error processing payroll ${payrollId}:`, error);
        failCount++;
      }
    }
    
    console.log(`📊 Email sending complete: ${successCount} successful, ${failCount} failed`);
    
    // Send Zapier webhook
    try {
      await ctx.runAction(api.zapier.sendToZapier, {
        eventType: "monthly_payroll_generated",
        payload: {
          month: args.month,
          year: args.year,
          monthName: monthNames[args.month - 1],
          totalPayrolls: args.payrollIds.length,
          successCount,
          failCount,
          timestamp: new Date().toISOString(),
        },
      });
      console.log("✅ Zapier webhook sent");
    } catch (error) {
      console.error("❌ Failed to send Zapier webhook:", error);
    }
    
    return {
      success: true,
      totalPayrolls: args.payrollIds.length,
      successCount,
      failCount,
    };
  },
});



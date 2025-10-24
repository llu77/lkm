import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ================== إيميل يومي - الساعة 3:00 صباحاً ==================
// تقرير يومي بالإيرادات والمصروفات مع إحصائيات مالية متقدمة
crons.daily(
  "daily-financial-report",
  { hourUTC: 0, minuteUTC: 0 }, // 3:00 AM Saudi Arabia Time (UTC+3)
  internal.scheduledEmails.sendDailyFinancialReport
);

// ================== إيميل شهري - يوم 1 الساعة 6:00 صباحاً ==================
// تقرير مفصل من تاريخ 1 إلى 30
crons.monthly(
  "monthly-financial-report",
  { day: 1, hourUTC: 3, minuteUTC: 0 }, // 6:00 AM Saudi Arabia Time (UTC+3)
  internal.scheduledEmails.sendMonthlyFinancialReport
);

// ================== إيميلات البونص الأسبوعي ==================
// يوم 8 - الساعة 6:00 صباحاً - بونص الأسبوع الأول (1-7)
crons.monthly(
  "weekly-bonus-email-week1",
  { day: 8, hourUTC: 3, minuteUTC: 0 }, // 6:00 AM Saudi Arabia Time (UTC+3)
  internal.scheduledEmails.sendWeeklyBonusEmails,
  { weekNumber: 1 }
);

// يوم 15 - الساعة 6:00 صباحاً - بونص الأسبوع الثاني (8-14)
crons.monthly(
  "weekly-bonus-email-week2",
  { day: 15, hourUTC: 3, minuteUTC: 0 },
  internal.scheduledEmails.sendWeeklyBonusEmails,
  { weekNumber: 2 }
);

// يوم 23 - الساعة 6:00 صباحاً - بونص الأسبوع الثالث (15-22)
crons.monthly(
  "weekly-bonus-email-week3",
  { day: 23, hourUTC: 3, minuteUTC: 0 },
  internal.scheduledEmails.sendWeeklyBonusEmails,
  { weekNumber: 3 }
);

// يوم 30 - الساعة 6:00 صباحاً - بونص الأسبوع الرابع (23-29)
crons.monthly(
  "weekly-bonus-email-week4",
  { day: 30, hourUTC: 3, minuteUTC: 0 },
  internal.scheduledEmails.sendWeeklyBonusEmails,
  { weekNumber: 4 }
);

export default crons;

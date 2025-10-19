import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import Navbar from "@/components/navbar.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { 
  TrendingUpIcon, 
  TrendingDownIcon, 
  DollarSignIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PackageIcon,
  UsersIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

function DashboardContent() {
  const stats = useQuery(api.dashboard.getStats);
  const chartData = useQuery(api.dashboard.getChartData);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);

  if (stats === undefined || chartData === undefined || recentActivity === undefined) {
    return (
      <div className="container py-8">
        <div className="space-y-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  const formatGrowth = (growth: number) => {
    return `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`;
  };

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground">نظرة عامة على الأداء المالي</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <TrendingUpIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.revenueGrowth >= 0 ? (
                  <ArrowUpIcon className="size-3 text-green-500" />
                ) : (
                  <ArrowDownIcon className="size-3 text-red-500" />
                )}
                <span className={stats.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatGrowth(stats.revenueGrowth)}
                </span>
                عن الشهر الماضي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <TrendingDownIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.expenseGrowth >= 0 ? (
                  <ArrowUpIcon className="size-3 text-red-500" />
                ) : (
                  <ArrowDownIcon className="size-3 text-green-500" />
                )}
                <span className={stats.expenseGrowth >= 0 ? "text-red-500" : "text-green-500"}>
                  {formatGrowth(stats.expenseGrowth)}
                </span>
                عن الشهر الماضي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صافي الدخل</CardTitle>
              <DollarSignIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.netIncome)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {stats.netIncomeGrowth >= 0 ? (
                  <ArrowUpIcon className="size-3 text-green-500" />
                ) : (
                  <ArrowDownIcon className="size-3 text-red-500" />
                )}
                <span className={stats.netIncomeGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                  {formatGrowth(stats.netIncomeGrowth)}
                </span>
                عن الشهر الماضي
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلبات المعلقة</CardTitle>
              <PackageIcon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.pendingProductOrdersCount + stats.pendingEmployeeOrdersCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingProductOrdersCount} منتجات، {stats.pendingEmployeeOrdersCount} موظفين
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        <Card>
          <CardHeader>
            <CardTitle>الأداء المالي - آخر 6 أشهر</CardTitle>
            <CardDescription>مقارنة الإيرادات والمصروفات</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px"
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--chart-1))" name="الإيرادات" />
                <Bar dataKey="expense" fill="hsl(var(--chart-2))" name="المصروفات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">آخر الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.recentRevenues.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد إيرادات حتى الآن
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.recentRevenues.map((revenue) => (
                    <div key={revenue._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{revenue.title}</p>
                        <p className="text-xs text-muted-foreground">{revenue.category}</p>
                      </div>
                      <p className="text-sm font-semibold text-green-500">
                        {formatCurrency(revenue.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">آخر المصروفات</CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity.recentExpenses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد مصروفات حتى الآن
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.recentExpenses.map((expense) => (
                    <div key={expense._id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{expense.title}</p>
                        <p className="text-xs text-muted-foreground">{expense.category}</p>
                      </div>
                      <p className="text-sm font-semibold text-red-500">
                        {formatCurrency(expense.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Unauthenticated>
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-4xl text-balance font-bold tracking-tight">
              يرجى تسجيل الدخول
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              سجل الدخول للوصول إلى لوحة التحكم
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container py-8">
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
    </div>
  );
}

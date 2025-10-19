import { useState } from "react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import Navbar from "@/components/navbar.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty.tsx";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { 
  TrendingUpIcon,
  PlusIcon,
  CalendarIcon,
  DollarSignIcon,
  CreditCardIcon,
  WalletIcon,
  TrashIcon,
  BarChart3Icon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

function RevenuesContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cash, setCash] = useState("");
  const [network, setNetwork] = useState("");
  const [budget, setBudget] = useState("");

  const revenues = useQuery(api.revenues.list, {});
  const stats = useQuery(api.revenues.getStats);
  const createRevenue = useMutation(api.revenues.create);
  const removeRevenue = useMutation(api.revenues.remove);

  const calculateTotal = () => {
    const cashNum = parseFloat(cash) || 0;
    const networkNum = parseFloat(network) || 0;
    const budgetNum = parseFloat(budget) || 0;
    return cashNum + networkNum + budgetNum;
  };

  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cashNum = parseFloat(cash) || 0;
    const networkNum = parseFloat(network) || 0;
    const budgetNum = parseFloat(budget) || 0;

    if (cashNum < 0 || networkNum < 0 || budgetNum < 0) {
      toast.error("يرجى إدخال قيم صحيحة");
      return;
    }

    const total = calculateTotal();
    if (total === 0) {
      toast.error("يجب أن يكون المجموع أكبر من صفر");
      return;
    }

    try {
      await createRevenue({
        date: new Date(date).getTime(),
        cash: cashNum,
        network: networkNum,
        budget: budgetNum,
      });
      
      toast.success("تم إضافة الإيراد بنجاح");
      setIsCreateDialogOpen(false);
      setDate(format(new Date(), "yyyy-MM-dd"));
      setCash("");
      setNetwork("");
      setBudget("");
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الإيراد");
      console.error(error);
    }
  };

  const handleDeleteRevenue = async (id: Id<"revenues">) => {
    try {
      await removeRevenue({ id });
      toast.success("تم حذف الإيراد بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الإيراد");
      console.error(error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  if (revenues === undefined || stats === undefined) {
    return (
      <div className="h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="container max-w-7xl py-6">
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="container max-w-7xl py-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUpIcon className="size-8 text-primary" />
                إدارة الإيرادات
              </h1>
              <p className="text-muted-foreground mt-1">تتبع وإدارة جميع مصادر الدخل اليومية</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <PlusIcon className="size-5" />
                  إضافة إيراد جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleCreateRevenue}>
                  <DialogHeader>
                    <DialogTitle>إضافة إيراد جديد</DialogTitle>
                    <DialogDescription>
                      أضف إيراد جديد مع تفاصيل الدفع
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">التاريخ *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cash">الكاش (ريال)</Label>
                      <Input
                        id="cash"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={cash}
                        onChange={(e) => setCash(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="network">الشبكة (ريال)</Label>
                      <Input
                        id="network"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget">الموازنة (ريال)</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />
                    </div>
                    <div className="rounded-lg border bg-muted p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">المجموع:</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit">إضافة الإيراد</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <DollarSignIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  من {stats.totalCount} عملية
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الكاش</CardTitle>
                <WalletIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalCash)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  نقدي
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الشبكة</CardTitle>
                <CreditCardIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalNetwork)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  بطاقات
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الموازنة</CardTitle>
                <BarChart3Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  موازنة
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الشهر الحالي</CardTitle>
                <CalendarIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.currentMonthTotal)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.currentMonthCount} عملية
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenues List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">قائمة الإيرادات</CardTitle>
              <CardDescription>
                عرض جميع الإيرادات المسجلة ({revenues.length})
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenues.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <TrendingUpIcon />
                    </EmptyMedia>
                    <EmptyTitle>لا توجد إيرادات</EmptyTitle>
                    <EmptyDescription>
                      ابدأ بإضافة أول إيراد لك
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                      <PlusIcon className="size-4 mr-2" />
                      إضافة إيراد
                    </Button>
                  </EmptyContent>
                </Empty>
              ) : (
                <div className="space-y-3">
                  {revenues.map((revenue) => (
                    <div
                      key={revenue._id}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            <CalendarIcon className="size-6 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {format(new Date(revenue.date), "EEEE، d MMMM yyyy", { locale: ar })}
                              </h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <WalletIcon className="size-4 text-muted-foreground" />
                                <span className="text-muted-foreground">كاش:</span>
                                <span className="font-medium">{formatCurrency(revenue.cash || 0)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CreditCardIcon className="size-4 text-muted-foreground" />
                                <span className="text-muted-foreground">شبكة:</span>
                                <span className="font-medium">{formatCurrency(revenue.network || 0)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <BarChart3Icon className="size-4 text-muted-foreground" />
                                <span className="text-muted-foreground">موازنة:</span>
                                <span className="font-medium">{formatCurrency(revenue.budget || 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-xs text-muted-foreground mb-1">المجموع</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(revenue.total || 0)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRevenue(revenue._id)}
                        >
                          <TrashIcon className="size-4 text-destructive" />
                        </Button>
                      </div>
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

export default function Revenues() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <Navbar />
      <Unauthenticated>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="text-center space-y-6">
            <h1 className="text-4xl text-balance font-bold tracking-tight">
              يرجى تسجيل الدخول
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              سجل الدخول للوصول إلى صفحة الإيرادات
            </p>
            <SignInButton />
          </div>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <RevenuesContent />
      </Authenticated>
    </div>
  );
}

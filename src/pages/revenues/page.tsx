import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty.tsx";
import Navbar from "@/components/navbar.tsx";
import { BranchSelector } from "@/components/branch-selector.tsx";
import { useBranch } from "@/hooks/use-branch.ts";
import { 
  TrendingUpIcon, 
  PlusIcon, 
  TrashIcon,
  CalendarIcon,
  DollarSignIcon,
  CreditCardIcon,
  TrendingDownIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns/format";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Textarea } from "@/components/ui/textarea.tsx";

function RevenuesPageContent() {
  const { branchId, branchName, isSelected, selectBranch } = useBranch();
  
  const stats = useQuery(
    api.revenues.getStats,
    isSelected ? { branchId: branchId! } : "skip"
  );
  const revenues = useQuery(
    api.revenues.list,
    isSelected ? { branchId: branchId! } : "skip"
  );
  const createRevenue = useMutation(api.revenues.create);
  const deleteRevenue = useMutation(api.revenues.remove);

  const [isAddingRevenue, setIsAddingRevenue] = useState(false);
  const [date, setDate] = useState("");
  const [cash, setCash] = useState("");
  const [network, setNetwork] = useState("");
  const [budget, setBudget] = useState("");
  const [mismatchReason, setMismatchReason] = useState("");
  const [showMismatchField, setShowMismatchField] = useState(false);

  // حساب المجموع والتحقق من المطابقة
  const cashNum = parseFloat(cash) || 0;
  const networkNum = parseFloat(network) || 0;
  const budgetNum = parseFloat(budget) || 0;
  const total = cashNum + networkNum + budgetNum;
  
  // شروط المطابقة:
  // 1. المجموع = كاش + شبكة
  // 2. الموازنة = الشبكة
  const condition1 = total === (cashNum + networkNum);
  const condition2 = budgetNum === networkNum;
  const isMatched = condition1 && condition2;

  // تحديث حالة عرض حقل السبب
  useEffect(() => {
    if (cash && network && budget) {
      setShowMismatchField(!isMatched);
      if (isMatched) {
        setMismatchReason("");
      }
    }
  }, [cash, network, budget, isMatched]);

  if (!isSelected) {
    return (
      <>
        <Navbar />
        <BranchSelector onBranchSelected={selectBranch} />
      </>
    );
  }

  // Handle loading state
  if (!stats || !revenues) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date || !cash || !network || !budget) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    if (!isMatched && !mismatchReason.trim()) {
      toast.error("يرجى إدخال سبب عدم المطابقة");
      return;
    }

    try {
      await createRevenue({
        date: new Date(date).getTime(),
        cash: parseFloat(cash),
        network: parseFloat(network),
        budget: parseFloat(budget),
        mismatchReason: !isMatched ? mismatchReason : undefined,
        branchId: branchId!,
        branchName: branchName!,
      });
      
      toast.success("تم إضافة الإيراد بنجاح");
      setIsAddingRevenue(false);
      setDate("");
      setCash("");
      setNetwork("");
      setBudget("");
      setMismatchReason("");
      setShowMismatchField(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الإيراد");
    }
  };

  const handleDelete = async (id: Id<"revenues">) => {
    try {
      await deleteRevenue({ id });
      toast.success("تم حذف الإيراد بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الإيراد");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header with Branch Name */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">الإيرادات</h1>
              <p className="text-muted-foreground">{branchName}</p>
            </div>
            <Button onClick={() => setIsAddingRevenue(!isAddingRevenue)}>
              <PlusIcon className="ml-2 size-4" />
              إضافة إيراد
            </Button>
          </div>

          {/* Add Revenue Form */}
          {isAddingRevenue && (
            <Card>
              <CardHeader>
                <CardTitle>إضافة إيراد جديد</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="date">التاريخ</Label>
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
                        placeholder="0.00"
                        value={cash}
                        onChange={(e) => setCash(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="network">الشبكة (ريال)</Label>
                      <Input
                        id="network"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={network}
                        onChange={(e) => setNetwork(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget">الموازنة (ريال)</Label>
                      <Input
                        id="budget"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* عرض حالة المطابقة */}
                  {cash && network && budget && (
                    <Card className={isMatched ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            {isMatched ? (
                              <>
                                <CheckCircle2Icon className="size-5 text-green-600" />
                                <span className="font-semibold text-green-700">مطابق ✓</span>
                              </>
                            ) : (
                              <>
                                <XCircleIcon className="size-5 text-red-600" />
                                <span className="font-semibold text-red-700">غير مطابق ✗</span>
                              </>
                            )}
                          </div>
                          <div className="text-sm space-y-1">
                            <p>المجموع: {total.toFixed(2)} ريال</p>
                            <p>المتوقع (كاش + شبكة): {(cashNum + networkNum).toFixed(2)} ريال</p>
                            <p>الفرق: {(total - (cashNum + networkNum)).toFixed(2)} ريال</p>
                            <p className={condition1 ? "text-green-600" : "text-red-600"}>
                              {condition1 ? "✓" : "✗"} الشرط الأول: المجموع = كاش + شبكة
                            </p>
                            <p className={condition2 ? "text-green-600" : "text-red-600"}>
                              {condition2 ? "✓" : "✗"} الشرط الثاني: الموازنة = الشبكة
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* حقل سبب عدم المطابقة */}
                  {showMismatchField && (
                    <div className="space-y-2">
                      <Label htmlFor="mismatchReason">سبب عدم المطابقة *</Label>
                      <Textarea
                        id="mismatchReason"
                        placeholder="اكتب سبب عدم المطابقة..."
                        value={mismatchReason}
                        onChange={(e) => setMismatchReason(e.target.value)}
                        required={!isMatched}
                        rows={3}
                      />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit">إضافة</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsAddingRevenue(false);
                        setDate("");
                        setCash("");
                        setNetwork("");
                        setBudget("");
                        setMismatchReason("");
                        setShowMismatchField(false);
                      }}
                    >
                      إلغاء
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
                <TrendingUpIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue.toFixed(2)} ريال</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الكاش</CardTitle>
                <DollarSignIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCash.toFixed(2)} ريال</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الشبكة</CardTitle>
                <CreditCardIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalNetwork.toFixed(2)} ريال</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الموازنة</CardTitle>
                <TrendingDownIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBudget.toFixed(2)} ريال</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الشهر الحالي</CardTitle>
                <CalendarIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentMonthTotal.toFixed(2)} ريال</div>
              </CardContent>
            </Card>
          </div>

          {/* Revenues List */}
          <Card>
            <CardHeader>
              <CardTitle>سجل الإيرادات</CardTitle>
            </CardHeader>
            <CardContent>
              {revenues.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <TrendingUpIcon />
                    </EmptyMedia>
                    <EmptyTitle>لا توجد إيرادات</EmptyTitle>
                    <EmptyDescription>ابدأ بإضافة أول إيراد</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {revenues.map((revenue) => (
                    <Card key={revenue._id} className="relative">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="size-4 text-muted-foreground" />
                              <span className="font-medium">
                                {format(new Date(revenue.date), "yyyy-MM-dd")}
                              </span>
                              {revenue.isMatched ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                  <CheckCircle2Icon className="size-3" />
                                  مطابق
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                  <XCircleIcon className="size-3" />
                                  غير مطابق
                                </span>
                              )}
                            </div>
                            <div className="grid gap-2 text-sm md:grid-cols-4">
                              <div>
                                <span className="text-muted-foreground">الكاش:</span>{" "}
                                <span className="font-medium">{revenue.cash?.toFixed(2)} ريال</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">الشبكة:</span>{" "}
                                <span className="font-medium">{revenue.network?.toFixed(2)} ريال</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">الموازنة:</span>{" "}
                                <span className="font-medium">{revenue.budget?.toFixed(2)} ريال</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">المجموع:</span>{" "}
                                <span className="font-bold">{revenue.total?.toFixed(2)} ريال</span>
                              </div>
                            </div>
                            {revenue.mismatchReason && (
                              <div className="rounded-lg bg-red-50 p-3 text-sm">
                                <span className="font-semibold text-red-900">سبب عدم المطابقة:</span>{" "}
                                <span className="text-red-700">{revenue.mismatchReason}</span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(revenue._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="size-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function RevenuesPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>تسجيل الدخول</CardTitle>
            </CardHeader>
            <CardContent>
              <SignInButton />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <Skeleton className="h-64 w-full max-w-md" />
        </div>
      </AuthLoading>
      <Authenticated>
        <RevenuesPageContent />
      </Authenticated>
    </>
  );
}

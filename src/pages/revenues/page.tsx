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
  const stats = useQuery(api.revenues.getStats, {});
  const revenues = useQuery(api.revenues.list, {});
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
  const expectedTotal = cashNum + networkNum;
  const isMatched = total === expectedTotal;

  // تحديث حالة عرض حقل السبب
  useEffect(() => {
    if (cash && network && budget) {
      setShowMismatchField(!isMatched);
      if (isMatched) {
        setMismatchReason("");
      }
    }
  }, [cash, network, budget, isMatched]);

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
      });
      
      toast.success("تم إضافة الإيراد بنجاح");
      setDate("");
      setCash("");
      setNetwork("");
      setBudget("");
      setMismatchReason("");
      setIsAddingRevenue(false);
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

  if (!stats || !revenues) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">الإيرادات</h1>
            <p className="text-muted-foreground">إدارة وتتبع جميع الإيرادات</p>
          </div>
          <Button 
            type="button"
            onClick={() => setIsAddingRevenue(!isAddingRevenue)}
          >
            <PlusIcon className="size-4" />
            إضافة إيراد
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
              <TrendingUpIcon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('ar-SA')} ر.س</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الكاش</CardTitle>
              <DollarSignIcon className="size-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCash.toLocaleString('ar-SA')} ر.س</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الشبكة</CardTitle>
              <CreditCardIcon className="size-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNetwork.toLocaleString('ar-SA')} ر.س</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الموازنة</CardTitle>
              <TrendingDownIcon className="size-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBudget.toLocaleString('ar-SA')} ر.س</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الشهر الحالي</CardTitle>
              <CalendarIcon className="size-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentMonthRevenue.toLocaleString('ar-SA')} ر.س</div>
            </CardContent>
          </Card>
        </div>

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
                    <Label htmlFor="cash">الكاش (ر.س)</Label>
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
                    <Label htmlFor="network">الشبكة (ر.س)</Label>
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
                    <Label htmlFor="budget">الموازنة (ر.س)</Label>
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

                {cash && network && budget && (
                  <div className={`p-4 rounded-lg border-2 ${isMatched ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isMatched ? (
                        <CheckCircle2Icon className="size-5 text-green-600" />
                      ) : (
                        <XCircleIcon className="size-5 text-red-600" />
                      )}
                      <span className={`font-bold ${isMatched ? 'text-green-700' : 'text-red-700'}`}>
                        {isMatched ? 'مطابق ✓' : 'غير مطابق ✗'}
                      </span>
                    </div>
                    <div className="text-sm">
                      <p><strong>المجموع:</strong> {total.toLocaleString('ar-SA')} ر.س</p>
                      <p><strong>المتوقع (كاش + شبكة):</strong> {expectedTotal.toLocaleString('ar-SA')} ر.س</p>
                      {!isMatched && (
                        <p className="text-red-600 font-medium mt-1">
                          الفرق: {Math.abs(total - expectedTotal).toLocaleString('ar-SA')} ر.س
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {showMismatchField && (
                  <div className="space-y-2">
                    <Label htmlFor="mismatchReason" className="text-red-600">
                      سبب عدم المطابقة *
                    </Label>
                    <Textarea
                      id="mismatchReason"
                      placeholder="يرجى توضيح سبب عدم تطابق المبالغ..."
                      value={mismatchReason}
                      onChange={(e) => setMismatchReason(e.target.value)}
                      required
                      className="min-h-[100px]"
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
                    }}
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

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
              <div className="space-y-3">
                {revenues.map((revenue) => (
                  <div
                    key={revenue._id}
                    className="flex items-start justify-between p-4 rounded-lg border"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(revenue.date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        {revenue.isMatched ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                            <CheckCircle2Icon className="size-3" />
                            مطابق
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            <XCircleIcon className="size-3" />
                            غير مطابق
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">الكاش:</span>
                          <span className="font-medium mr-1">
                            {(revenue.cash || 0).toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الشبكة:</span>
                          <span className="font-medium mr-1">
                            {(revenue.network || 0).toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">الموازنة:</span>
                          <span className="font-medium mr-1">
                            {(revenue.budget || 0).toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">المجموع:</span>
                          <span className="font-bold text-primary mr-1">
                            {(revenue.total || 0).toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                      </div>

                      {!revenue.isMatched && revenue.mismatchReason && (
                        <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                          <p className="text-xs font-medium text-red-600 mb-1">سبب عدم المطابقة:</p>
                          <p className="text-sm text-red-700">{revenue.mismatchReason}</p>
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(revenue._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RevenuesPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>يرجى تسجيل الدخول</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="container mx-auto p-6 space-y-6">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          </div>
        </div>
      </AuthLoading>
      <Authenticated>
        <RevenuesPageContent />
      </Authenticated>
    </>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Trash2, TrendingUp, Wallet, CreditCard, Scale, Calendar, CheckCircle2, XCircle, UserPlus, X } from "lucide-react";
import Navbar from "@/components/navbar.tsx";
import { BranchSelector } from "@/components/branch-selector.tsx";
import { useBranch } from "@/hooks/use-branch.ts";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

const BRANCH_EMPLOYEES = {
  "1010": ["عبدالحي جلال", "محمود عمارة", "علاء ناصر", "السيد محمد", "عمرو"],
  "2020": ["محمد إسماعيل", "محمد ناصر", "فارس محمد"],
};

type Employee = {
  name: string;
  revenue: number;
};

function RevenuesPageContent() {
  const { branchId, branchName } = useBranch();
  const [isAdding, setIsAdding] = useState(false);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [cash, setCash] = useState("");
  const [network, setNetwork] = useState("");
  const [budget, setBudget] = useState("");
  const [mismatchReason, setMismatchReason] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);

  const stats = useQuery(api.revenues.getStats, { branchId: branchId! });
  const revenues = useQuery(api.revenues.list, { branchId: branchId! });
  const createRevenue = useMutation(api.revenues.create);
  const deleteRevenue = useMutation(api.revenues.remove);

  const cashNum = parseFloat(cash) || 0;
  const networkNum = parseFloat(network) || 0;
  const budgetNum = parseFloat(budget) || 0;
  const total = cashNum + networkNum + budgetNum;

  // شروط المطابقة:
  // 1. المجموع = كاش + شبكة (بدون موازنة)
  // 2. الموازنة = الشبكة
  const condition1 = total === cashNum + networkNum;
  const condition2 = budgetNum === networkNum;
  const isMatched = condition1 && condition2;
  const difference = total - (cashNum + networkNum);

  const availableEmployees = BRANCH_EMPLOYEES[branchId as keyof typeof BRANCH_EMPLOYEES] || [];

  const handleAddEmployee = () => {
    if (employees.length < 6) {
      setEmployees([...employees, { name: "", revenue: 0 }]);
    } else {
      toast.error("الحد الأقصى 6 موظفين");
    }
  };

  const handleRemoveEmployee = (index: number) => {
    setEmployees(employees.filter((_, i) => i !== index));
  };

  const handleEmployeeChange = (index: number, field: "name" | "revenue", value: string | number) => {
    const updated = [...employees];
    if (field === "name") {
      updated[index].name = value as string;
    } else {
      updated[index].revenue = typeof value === "string" ? parseFloat(value) || 0 : value;
    }
    setEmployees(updated);
  };

  const handleSubmit = async () => {
    if (!date || cashNum === 0 || networkNum === 0) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if (!isMatched && !mismatchReason.trim()) {
      toast.error("يرجى إدخال سبب عدم المطابقة");
      return;
    }

    try {
      await createRevenue({
        date: new Date(date).getTime(),
        cash: cashNum,
        network: networkNum,
        budget: budgetNum,
        branchId: branchId!,
        branchName: branchName!,
        mismatchReason: !isMatched ? mismatchReason : undefined,
        employees: employees.filter(e => e.name && e.revenue > 0),
      });

      toast.success("تم إضافة الإيراد بنجاح");
      setIsAdding(false);
      setCash("");
      setNetwork("");
      setBudget("");
      setMismatchReason("");
      setEmployees([]);
      setDate(format(new Date(), "yyyy-MM-dd"));
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الإيراد");
      console.error(error);
    }
  };

  const handleDelete = async (id: Id<"revenues">) => {
    try {
      await deleteRevenue({ id });
      toast.success("تم حذف الإيراد بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف الإيراد");
      console.error(error);
    }
  };

  // Group revenues by date
  const revenuesByDate = revenues?.reduce((acc, revenue) => {
    const dateKey = format(new Date(revenue.date), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(revenue);
    return acc;
  }, {} as Record<string, typeof revenues>);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">إدارة الإيرادات</h1>
            <p className="text-muted-foreground">الفرع: {branchName}</p>
          </div>
          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} size="lg">
              <TrendingUp className="ml-2 size-5" />
              إضافة إيراد
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {stats ? (
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الإيرادات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString("ar-SA")} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الكاش</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.totalCash.toLocaleString("ar-SA")} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الشبكة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.totalNetwork.toLocaleString("ar-SA")} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">إجمالي الموازنة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{stats.totalBudget.toLocaleString("ar-SA")} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">الشهر الحالي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.currentMonthTotal.toLocaleString("ar-SA")} ر.س</div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        )}

        {/* Add Revenue Form */}
        {isAdding && (
          <Card className="border-2 border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>إضافة إيراد جديد</CardTitle>
                  <CardDescription>أدخل بيانات الإيراد اليومي</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                  <X className="size-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    <Calendar className="ml-1 inline size-4" />
                    التاريخ
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cash">
                    <Wallet className="ml-1 inline size-4" />
                    الكاش (ر.س)
                  </Label>
                  <Input
                    id="cash"
                    type="number"
                    placeholder="0"
                    value={cash}
                    onChange={(e) => setCash(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="network">
                    <CreditCard className="ml-1 inline size-4" />
                    الشبكة (ر.س)
                  </Label>
                  <Input
                    id="network"
                    type="number"
                    placeholder="0"
                    value={network}
                    onChange={(e) => setNetwork(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">
                    <Scale className="ml-1 inline size-4" />
                    الموازنة (ر.س)
                  </Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              {/* Employees Section */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">موظفو الإيراد</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddEmployee}
                    disabled={employees.length >= 6}
                  >
                    <UserPlus className="ml-2 size-4" />
                    إضافة موظف ({employees.length}/6)
                  </Button>
                </div>
                {employees.length > 0 && (
                  <div className="space-y-2">
                    {employees.map((employee, index) => (
                      <div key={index} className="flex gap-2">
                        <Select
                          value={employee.name}
                          onValueChange={(value) => handleEmployeeChange(index, "name", value)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="اختر الموظف" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableEmployees.map((emp) => (
                              <SelectItem key={emp} value={emp}>
                                {emp}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="الإيراد"
                          className="w-32"
                          value={employee.revenue || ""}
                          onChange={(e) => handleEmployeeChange(index, "revenue", e.target.value)}
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveEmployee(index)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Matching Status */}
              <Card className={isMatched ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isMatched ? (
                        <>
                          <CheckCircle2 className="size-6 text-green-600" />
                          <div>
                            <div className="font-bold text-green-900">مطابق ✓</div>
                            <div className="text-sm text-green-700">جميع الشروط متحققة</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="size-6 text-red-600" />
                          <div>
                            <div className="font-bold text-red-900">غير مطابق ✗</div>
                            <div className="text-sm text-red-700">
                              الفرق: {difference.toLocaleString("ar-SA")} ر.س
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold">{total.toLocaleString("ar-SA")} ر.س</div>
                      <div className="text-sm text-muted-foreground">المجموع</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!isMatched && (
                <div className="space-y-2">
                  <Label htmlFor="reason" className="text-red-600">
                    سبب عدم المطابقة (مطلوب) *
                  </Label>
                  <Textarea
                    id="reason"
                    placeholder="اكتب سبب عدم المطابقة هنا..."
                    value={mismatchReason}
                    onChange={(e) => setMismatchReason(e.target.value)}
                    className="border-red-300"
                    rows={2}
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSubmit} size="lg" className="flex-1">
                  إضافة الإيراد
                </Button>
                <Button variant="outline" size="lg" onClick={() => setIsAdding(false)}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Revenue Records */}
        <Card>
          <CardHeader>
            <CardTitle>سجل الإيرادات</CardTitle>
            <CardDescription>جميع إيرادات الفرع مرتبة حسب التاريخ</CardDescription>
          </CardHeader>
          <CardContent>
            {revenuesByDate && Object.keys(revenuesByDate).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(revenuesByDate)
                  .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                  .map(([dateKey, dayRevenues]) => {
                    const dayTotal = dayRevenues.reduce((sum, r) => sum + (r.total || 0), 0);
                    const dayCash = dayRevenues.reduce((sum, r) => sum + (r.cash || 0), 0);
                    const dayNetwork = dayRevenues.reduce((sum, r) => sum + (r.network || 0), 0);
                    const dayBudget = dayRevenues.reduce((sum, r) => sum + (r.budget || 0), 0);
                    const allMatched = dayRevenues.every(r => r.isMatched);

                    return (
                      <Card key={dateKey} className={allMatched ? "border-green-200" : "border-red-200"}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex flex-col">
                                <span className="text-lg font-bold">
                                  {format(new Date(dateKey), "EEEE، d MMMM yyyy", { locale: ar })}
                                </span>
                                <div className="mt-2 flex gap-4 text-sm">
                                  <span className="text-green-600">كاش: {dayCash.toLocaleString("ar-SA")} ر.س</span>
                                  <span className="text-blue-600">شبكة: {dayNetwork.toLocaleString("ar-SA")} ر.س</span>
                                  <span className="text-purple-600">موازنة: {dayBudget.toLocaleString("ar-SA")} ر.س</span>
                                </div>
                                {dayRevenues[0].employees && dayRevenues[0].employees.length > 0 && (
                                  <div className="mt-2 text-sm text-muted-foreground">
                                    الموظفين: {dayRevenues[0].employees.map(e => `${e.name} (${e.revenue.toLocaleString("ar-SA")} ر.س)`).join(" • ")}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-left">
                                <div className="text-2xl font-bold">{dayTotal.toLocaleString("ar-SA")} ر.س</div>
                                <div className="flex items-center gap-2">
                                  {allMatched ? (
                                    <>
                                      <CheckCircle2 className="size-4 text-green-600" />
                                      <span className="text-sm text-green-600">مطابق</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="size-4 text-red-600" />
                                      <span className="text-sm text-red-600">غير مطابق</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(dayRevenues[0]._id)}
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          {!allMatched && dayRevenues[0].mismatchReason && (
                            <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
                              <strong>سبب عدم المطابقة:</strong> {dayRevenues[0].mismatchReason}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                لا توجد إيرادات بعد. ابدأ بإضافة إيراد جديد!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RevenuesPage() {
  const { branchId, isSelected } = useBranch();
  const [showSelector, setShowSelector] = useState(!isSelected);

  useEffect(() => {
    if (!branchId) {
      setShowSelector(true);
    } else {
      setShowSelector(false);
    }
  }, [branchId]);

  if (showSelector) {
    return (
      <BranchSelector
        onBranchSelected={() => {
          setShowSelector(false);
        }}
      />
    );
  }

  return (
    <>
      <Authenticated>
        <RevenuesPageContent />
      </Authenticated>
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center">
          <Card>
            <CardHeader>
              <CardTitle>يجب تسجيل الدخول</CardTitle>
            </CardHeader>
            <CardContent>
              <SignInButton />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="flex min-h-screen items-center justify-center">
          <Skeleton className="h-96 w-full max-w-4xl" />
        </div>
      </AuthLoading>
    </>
  );
}

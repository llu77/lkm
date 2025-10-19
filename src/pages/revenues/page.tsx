import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { 
  TrendingUpIcon, 
  DollarSignIcon, 
  CreditCardIcon,
  PiggyBankIcon,
  CalendarIcon,
  PlusIcon,
  XIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Trash2Icon,
  AlertTriangleIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useBranch } from "@/hooks/use-branch.ts";
import { BranchSelector } from "@/components/branch-selector.tsx";
import Navbar from "@/components/navbar.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";

type Employee = {
  name: string;
  revenue: number;
};

const BRANCH_EMPLOYEES: Record<string, string[]> = {
  "1010": ["عبدالحي جلال", "محمود عمارة", "علاء ناصر", "السيد محمد", "عمرو"],
  "2020": ["محمد إسماعيل", "محمد ناصر", "فارس محمد"],
};

export default function Revenues() {
  const { branchId, branchName } = useBranch();

  if (!branchId) {
    return <BranchSelector onBranchSelected={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Authenticated>
          <RevenuesContent branchId={branchId} branchName={branchName || ""} />
        </Authenticated>
        <Unauthenticated>
          <Card className="mx-auto mt-8 max-w-md">
            <CardHeader>
              <CardTitle>يرجى تسجيل الدخول</CardTitle>
            </CardHeader>
            <CardContent>
              <SignInButton />
            </CardContent>
          </Card>
        </Unauthenticated>
        <AuthLoading>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </AuthLoading>
      </main>
    </div>
  );
}

function RevenuesContent({ branchId, branchName }: { branchId: string; branchName: string }) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  
  const stats = useQuery(api.revenues.getStats, { branchId });
  const revenues = useQuery(api.revenues.list, { 
    branchId,
    month: currentMonth,
    year: currentYear,
  });
  
  const createRevenue = useMutation(api.revenues.create);
  const removeRevenue = useMutation(api.revenues.remove);

  const [date, setDate] = useState<string>(
    new Date(currentYear, currentMonth, new Date().getDate()).toISOString().split("T")[0]
  );
  const [cash, setCash] = useState<string>("");
  const [network, setNetwork] = useState<string>("");
  const [budget, setBudget] = useState<string>("");
  const [mismatchReason, setMismatchReason] = useState<string>("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deleteId, setDeleteId] = useState<Id<"revenues"> | null>(null);
  const [deletePassword, setDeletePassword] = useState("");

  const cashNum = parseFloat(cash) || 0;
  const networkNum = parseFloat(network) || 0;
  const budgetNum = parseFloat(budget) || 0;
  const calculatedTotal = cashNum + networkNum;
  const total = cashNum + networkNum + budgetNum;

  // شروط المطابقة
  const condition1 = total === calculatedTotal; // المجموع = كاش + شبكة (بدون موازنة)
  const condition2 = budgetNum === networkNum; // الموازنة = الشبكة
  const isMatched = condition1 && condition2;

  const employeeList = BRANCH_EMPLOYEES[branchId] || [];

  const handleAddEmployee = () => {
    if (employees.length >= 6) {
      toast.error("الحد الأقصى 6 موظفين");
      return;
    }
    setEmployees([...employees, { name: "", revenue: 0 }]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cash || !network) {
      toast.error("يرجى إدخال الكاش والشبكة");
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
        branchId,
        branchName,
        employees: employees.filter(e => e.name && e.revenue > 0),
        mismatchReason: !isMatched ? mismatchReason : undefined,
      });

      toast.success("تم إضافة الإيراد بنجاح");
      
      // Reset form
      setCash("");
      setNetwork("");
      setBudget("");
      setMismatchReason("");
      setEmployees([]);
      setShowForm(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة الإيراد");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    if (!deletePassword) {
      toast.error("يرجى إدخال كلمة المرور");
      return;
    }

    try {
      await removeRevenue({ id: deleteId, password: deletePassword });
      toast.success("تم حذف الإيراد بنجاح");
      setDeleteId(null);
      setDeletePassword("");
    } catch (error) {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("ar-SA", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <TrendingUpIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.totalRevenue.toLocaleString()} ر.س` : <Skeleton className="h-8 w-24" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الكاش</CardTitle>
            <DollarSignIcon className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.totalCash.toLocaleString()} ر.س` : <Skeleton className="h-8 w-24" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الشبكة</CardTitle>
            <CreditCardIcon className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.totalNetwork.toLocaleString()} ر.س` : <Skeleton className="h-8 w-24" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموازنة</CardTitle>
            <PiggyBankIcon className="size-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.totalBudget.toLocaleString()} ر.س` : <Skeleton className="h-8 w-24" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الشهر الحالي</CardTitle>
            <CalendarIcon className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.currentMonthTotal.toLocaleString()} ر.س` : <Skeleton className="h-8 w-24" />}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Revenue Form */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <PlusIcon className="ml-2 size-4" />
          إضافة إيراد جديد
        </Button>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>إضافة إيراد جديد</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <XIcon className="size-4" />
              </Button>
            </div>
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
                  <Label htmlFor="cash">الكاش (نقدي)</Label>
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
                  <Label htmlFor="network">الشبكة (بطاقات)</Label>
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
                  <Label htmlFor="budget">الموازنة</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculated Total */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">المجموع المحسوب (كاش + شبكة):</span>
                  <span className="text-xl font-bold text-primary">{calculatedTotal.toLocaleString()} ر.س</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>الشرط الأول: المجموع = كاش + شبكة</span>
                  {condition1 ? (
                    <CheckCircle2Icon className="size-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="size-5 text-red-600" />
                  )}
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-muted-foreground">
                  <span>الشرط الثاني: الموازنة = الشبكة</span>
                  {condition2 ? (
                    <CheckCircle2Icon className="size-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="size-5 text-red-600" />
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between border-t pt-3">
                  <span className="font-semibold">حالة المطابقة:</span>
                  {isMatched ? (
                    <span className="flex items-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2Icon className="size-5" />
                      مطابق
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-red-600 font-semibold">
                      <XCircleIcon className="size-5" />
                      غير مطابق
                    </span>
                  )}
                </div>
              </div>

              {!isMatched && (
                <div className="space-y-2">
                  <Label htmlFor="mismatchReason">سبب عدم المطابقة *</Label>
                  <Textarea
                    id="mismatchReason"
                    placeholder="يرجى كتابة سبب عدم المطابقة..."
                    value={mismatchReason}
                    onChange={(e) => setMismatchReason(e.target.value)}
                    required={!isMatched}
                    rows={3}
                  />
                </div>
              )}

              {/* Employees Section */}
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">موظفو الإيراد (اختياري)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddEmployee}
                    disabled={employees.length >= 6}
                  >
                    <PlusIcon className="ml-2 size-4" />
                    إضافة موظف ({employees.length}/6)
                  </Button>
                </div>

                {employees.map((employee, index) => (
                  <div key={index} className="flex gap-2">
                    <Select
                      value={employee.name}
                      onValueChange={(value) => handleEmployeeChange(index, "name", value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="اختر موظف" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeList.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="الإيراد"
                      value={employee.revenue || ""}
                      onChange={(e) => handleEmployeeChange(index, "revenue", e.target.value)}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveEmployee(index)}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full">
                حفظ الإيراد
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Month Navigation and Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>سجل الإيرادات</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronRightIcon className="size-4" />
              </Button>
              <span className="min-w-[150px] text-center font-semibold">{monthName}</span>
              <Button variant="outline" size="icon" onClick={goToNextMonth}>
                <ChevronLeftIcon className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!revenues ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : revenues.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              لا توجد إيرادات لهذا الشهر
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الكاش</TableHead>
                    <TableHead className="text-right">الشبكة</TableHead>
                    <TableHead className="text-right">الموازنة</TableHead>
                    <TableHead className="text-right">المجموع</TableHead>
                    <TableHead className="text-right">الموظفون</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-center">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((revenue) => (
                    <TableRow key={revenue._id}>
                      <TableCell className="font-medium">
                        {new Date(revenue.date).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell>{(revenue.cash || 0).toLocaleString()} ر.س</TableCell>
                      <TableCell>{(revenue.network || 0).toLocaleString()} ر.س</TableCell>
                      <TableCell>{(revenue.budget || 0).toLocaleString()} ر.س</TableCell>
                      <TableCell className="font-semibold">
                        {(revenue.total || 0).toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        {revenue.employees && revenue.employees.length > 0 ? (
                          <div className="space-y-1">
                            {revenue.employees.map((emp, idx) => (
                              <div key={idx} className="text-sm">
                                {emp.name}: {emp.revenue.toLocaleString()} ر.س
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {revenue.isMatched ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2Icon className="size-4" />
                            <span className="text-sm font-semibold">مطابق</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircleIcon className="size-4" />
                              <span className="text-sm font-semibold">غير مطابق</span>
                            </div>
                            {revenue.mismatchReason && (
                              <div className="text-xs text-muted-foreground">
                                السبب: {revenue.mismatchReason}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(revenue._id)}
                        >
                          <Trash2Icon className="size-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-5 text-red-600" />
              تأكيد الحذف
            </AlertDialogTitle>
            <AlertDialogDescription>
              لحذف هذا الإيراد، يرجى إدخال كلمة المرور
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="deletePassword">كلمة المرور</Label>
            <Input
              id="deletePassword"
              type="password"
              placeholder="أدخل كلمة المرور"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletePassword("")}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
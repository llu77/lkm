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
import { Textarea } from "@/components/ui/textarea.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select.tsx";
import { 
  TrendingUpIcon,
  PlusIcon,
  CalendarIcon,
  DollarSignIcon,
  TagIcon,
  FilterIcon,
  EditIcon,
  TrashIcon,
  BarChart3Icon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const REVENUE_CATEGORIES = [
  "مبيعات",
  "خدمات",
  "استثمارات",
  "عقود",
  "مشاريع",
  "استشارات",
  "تدريب",
  "أخرى",
];

function RevenuesContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const revenues = useQuery(api.revenues.list, { 
    category: selectedCategory === "all" ? undefined : selectedCategory 
  });
  const stats = useQuery(api.revenues.getStats);
  const createRevenue = useMutation(api.revenues.create);
  const removeRevenue = useMutation(api.revenues.remove);

  const handleCreateRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !amount || !category) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("يرجى إدخال مبلغ صحيح");
      return;
    }

    try {
      await createRevenue({
        title: title.trim(),
        amount: amountNum,
        category,
        description: description.trim() || undefined,
        date: new Date(date).getTime(),
      });
      
      toast.success("تم إضافة الإيراد بنجاح");
      setIsCreateDialogOpen(false);
      setTitle("");
      setAmount("");
      setCategory("");
      setDescription("");
      setDate(format(new Date(), "yyyy-MM-dd"));
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
              <p className="text-muted-foreground mt-1">تتبع وإدارة جميع مصادر الدخل</p>
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
                      أضف إيراد جديد إلى السجلات المالية
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">العنوان *</Label>
                      <Input
                        id="title"
                        placeholder="مثال: دفعة مشروع العميل أ"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount">المبلغ (ريال) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          required
                        />
                      </div>
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
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">التصنيف *</Label>
                      <Select value={category} onValueChange={setCategory} required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                        <SelectContent>
                          {REVENUE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea
                        id="description"
                        placeholder="تفاصيل إضافية عن الإيراد..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
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
          <div className="grid gap-4 md:grid-cols-4">
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
                <CardTitle className="text-sm font-medium">إيرادات الشهر الحالي</CardTitle>
                <CalendarIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.currentMonthTotal)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.currentMonthCount} عملية
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">متوسط الإيراد</CardTitle>
                <BarChart3Icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(stats.averageRevenue)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  لكل عملية
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">عدد التصنيفات</CardTitle>
                <TagIcon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.categoryTotals.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  تصنيف نشط
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FilterIcon className="size-5" />
                تصفية الإيرادات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="filter-category">التصنيف</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger id="filter-category">
                      <SelectValue placeholder="جميع التصنيفات" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع التصنيفات</SelectItem>
                      {REVENUE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

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
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            <TrendingUpIcon className="size-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{revenue.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <TagIcon className="size-3" />
                              <span>{revenue.category}</span>
                              <span>•</span>
                              <CalendarIcon className="size-3" />
                              <span>
                                {format(new Date(revenue.date), "d MMMM yyyy", { locale: ar })}
                              </span>
                            </div>
                            {revenue.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {revenue.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {formatCurrency(revenue.amount)}
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

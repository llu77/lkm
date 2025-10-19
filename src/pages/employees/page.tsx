import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useBranch } from "@/hooks/use-branch.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import Navbar from "@/components/navbar.tsx";
import { BranchSelector } from "@/components/branch-selector.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { 
  UsersIcon, 
  PlusIcon, 
  EditIcon, 
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function EmployeesPage() {
  return (
    <>
      <Navbar />
      <Unauthenticated>
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <UsersIcon className="mx-auto size-12 text-primary" />
              <CardTitle>إدارة الموظفين</CardTitle>
              <CardDescription>
                يرجى تسجيل الدخول للوصول إلى صفحة الموظفين
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <SignInButton />
            </CardContent>
          </Card>
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="container mx-auto max-w-7xl space-y-6 p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AuthLoading>
      <Authenticated>
        <EmployeesPageContent />
      </Authenticated>
    </>
  );
}

function EmployeesPageContent() {
  const { branchId, branchName } = useBranch();
  const employees = useQuery(api.employees.listEmployees, { branchId: branchId || undefined });
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Id<"employees"> | null>(null);

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    toast.success("تم إضافة الموظف بنجاح");
  };

  const handleEditSuccess = () => {
    setEditingEmployee(null);
    toast.success("تم تحديث بيانات الموظف");
  };

  if (employees === undefined) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const filteredEmployees = branchId === "all" 
    ? employees 
    : employees.filter(e => e.branchId === branchId);

  return (
    <div className="container mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة الموظفين</h1>
          <p className="text-muted-foreground">
            إدارة بيانات الموظفين والرواتب والحوافز
          </p>
        </div>
        <BranchSelector onBranchSelected={() => {}} />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredEmployees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">الموظفون النشطون</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredEmployees.filter(e => e.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الرواتب</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredEmployees
                .filter(e => e.isActive)
                .reduce((sum, e) => sum + e.baseSalary + e.incentives, 0)
                .toLocaleString()} ر.س
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="size-4" />
              إضافة موظف
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إضافة موظف جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات الموظف الجديد
              </DialogDescription>
            </DialogHeader>
            <AddEmployeeForm 
              branchId={branchId === "all" ? undefined : (branchId || undefined)}
              branchName={branchName || undefined}
              onSuccess={handleAddSuccess} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة الموظفين</CardTitle>
          <CardDescription>
            عرض وإدارة جميع بيانات الموظفين
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <UsersIcon className="size-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">لا يوجد موظفون</p>
              <Button 
                className="mt-4" 
                onClick={() => setIsAddDialogOpen(true)}
              >
                إضافة أول موظف
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الفرع</TableHead>
                    <TableHead>رقم الهوية</TableHead>
                    <TableHead>تاريخ الانتهاء</TableHead>
                    <TableHead>الراتب الأساسي</TableHead>
                    <TableHead>الحوافز</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell className="font-medium">
                        {employee.employeeName}
                      </TableCell>
                      <TableCell>{employee.branchName}</TableCell>
                      <TableCell>
                        {employee.nationalId || "-"}
                      </TableCell>
                      <TableCell>
                        {employee.idExpiryDate ? (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="size-3" />
                            {format(employee.idExpiryDate, "dd MMM yyyy", { locale: ar })}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>
                        {employee.baseSalary.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        {employee.incentives.toLocaleString()} ر.س
                      </TableCell>
                      <TableCell>
                        {employee.isActive ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircleIcon className="size-3" />
                            نشط
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircleIcon className="size-3" />
                            غير نشط
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog 
                            open={editingEmployee === employee._id}
                            onOpenChange={(open) => setEditingEmployee(open ? employee._id : null)}
                          >
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <EditIcon className="size-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>تعديل بيانات الموظف</DialogTitle>
                                <DialogDescription>
                                  تحديث معلومات الموظف
                                </DialogDescription>
                              </DialogHeader>
                              <EditEmployeeForm 
                                employee={employee}
                                onSuccess={handleEditSuccess}
                              />
                            </DialogContent>
                          </Dialog>
                          <DeleteEmployeeButton employeeId={employee._id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddEmployeeForm({ 
  branchId, 
  branchName,
  onSuccess 
}: { 
  branchId?: string;
  branchName?: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    branchId: branchId || "",
    branchName: branchName || "",
    employeeName: "",
    nationalId: "",
    idExpiryDate: "",
    baseSalary: 2000,
    incentives: 0,
  });

  const createEmployee = useMutation(api.employees.createEmployee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.branchId) {
      toast.error("يرجى اختيار الفرع");
      return;
    }

    try {
      await createEmployee({
        branchId: formData.branchId,
        branchName: formData.branchName,
        employeeName: formData.employeeName,
        nationalId: formData.nationalId || undefined,
        idExpiryDate: formData.idExpiryDate ? new Date(formData.idExpiryDate).getTime() : undefined,
        baseSalary: formData.baseSalary,
        incentives: formData.incentives,
      });
      onSuccess();
    } catch (error) {
      toast.error("فشل في إضافة الموظف");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>اسم الموظف *</Label>
          <Input
            required
            value={formData.employeeName}
            onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
            placeholder="أدخل اسم الموظف"
          />
        </div>
        <div className="space-y-2">
          <Label>رقم الهوية</Label>
          <Input
            value={formData.nationalId}
            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
            placeholder="أدخل رقم الهوية"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>تاريخ انتهاء الهوية</Label>
        <Input
          type="date"
          value={formData.idExpiryDate}
          onChange={(e) => setFormData({ ...formData, idExpiryDate: e.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>الراتب الأساسي *</Label>
          <Input
            required
            type="number"
            value={formData.baseSalary}
            onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
            placeholder="2000"
          />
        </div>
        <div className="space-y-2">
          <Label>الحوافز</Label>
          <Input
            type="number"
            value={formData.incentives}
            onChange={(e) => setFormData({ ...formData, incentives: Number(e.target.value) })}
            placeholder="0"
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        إضافة الموظف
      </Button>
    </form>
  );
}

function EditEmployeeForm({ 
  employee, 
  onSuccess 
}: { 
  employee: {
    _id: Id<"employees">;
    employeeName: string;
    nationalId?: string;
    idExpiryDate?: number;
    baseSalary: number;
    incentives: number;
    isActive: boolean;
  };
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    employeeName: employee.employeeName,
    nationalId: employee.nationalId || "",
    idExpiryDate: employee.idExpiryDate ? format(employee.idExpiryDate, "yyyy-MM-dd") : "",
    baseSalary: employee.baseSalary,
    incentives: employee.incentives,
    isActive: employee.isActive,
  });

  const updateEmployee = useMutation(api.employees.updateEmployee);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateEmployee({
        employeeId: employee._id,
        employeeName: formData.employeeName,
        nationalId: formData.nationalId || undefined,
        idExpiryDate: formData.idExpiryDate ? new Date(formData.idExpiryDate).getTime() : undefined,
        baseSalary: formData.baseSalary,
        incentives: formData.incentives,
        isActive: formData.isActive,
      });
      onSuccess();
    } catch (error) {
      toast.error("فشل في تحديث بيانات الموظف");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>اسم الموظف *</Label>
          <Input
            required
            value={formData.employeeName}
            onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>رقم الهوية</Label>
          <Input
            value={formData.nationalId}
            onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>تاريخ انتهاء الهوية</Label>
        <Input
          type="date"
          value={formData.idExpiryDate}
          onChange={(e) => setFormData({ ...formData, idExpiryDate: e.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>الراتب الأساسي *</Label>
          <Input
            required
            type="number"
            value={formData.baseSalary}
            onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
          />
        </div>
        <div className="space-y-2">
          <Label>الحوافز</Label>
          <Input
            type="number"
            value={formData.incentives}
            onChange={(e) => setFormData({ ...formData, incentives: Number(e.target.value) })}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="size-4"
        />
        <Label htmlFor="isActive">موظف نشط</Label>
      </div>

      <Button type="submit" className="w-full">
        حفظ التغييرات
      </Button>
    </form>
  );
}

function DeleteEmployeeButton({ employeeId }: { employeeId: Id<"employees"> }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteEmployee = useMutation(api.employees.deleteEmployee);

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الموظف؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteEmployee({ employeeId });
      toast.success("تم حذف الموظف بنجاح");
    } catch (error) {
      toast.error("فشل في حذف الموظف");
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <TrashIcon className="size-4 text-destructive" />
    </Button>
  );
}
